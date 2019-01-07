function main(request,  response)
{
    var recId = request.getParameter('recId') * 1;
    var isSOEditAndSave = request.getParameter('isSOEditAndSave');
    if (recId) {
        if (isSOEditAndSave) {
            var errMsg = validateSO(recId);
            dLog('errMsg - validateSO', errMsg);
            if (errMsg) {
                response.write(errMsg);  
            } else {
                response.write('1');      
            }
        } else {
            var errMsg = approveAllBackOrder(recId);
            dLog('errMsg - Approve All BackOrder', errMsg);
            if (errMsg) {
                response.write(errMsg);  
            } else {
                response.write('1');      
            }
        }
        return;
    }
    response.write('0');
}

function validateSO(recId)
{
    var soRec = nlapiLoadRecord('salesorder', recId);
    
    var shipDate = soRec.getFieldValue('shipdate');
    var customerId = soRec.getFieldValue('entity');
    var departmentId = soRec.getFieldValue('department');
    if (departmentId) {
        var parentDepId = getDepartmentParentId(departmentId);
        if (parentDepId == 32) { // Sephora : SEA
            departmentId = parentDepId;
        }
    }
  
    var nothingSWItemList = [];
    var lineCount = soRec.getLineItemCount('item');
    for (var i = 1; i <= lineCount; i ++) {
        if (soRec.getLineItemValue('item', 'custcol_enable_alloc', i) == 'T') {
            var boQty = soRec.getLineItemValue('item', 'custcol_alloc_backorder_qty', i) * 1;
            if (boQty > 0) { 
                var shipWindow = soRec.getLineItemValue('item', 'custcol_item_alloc_shipwindow', i);
                if (shipWindow.indexOf('Nothing') > -1) {
                    var itemId = soRec.getLineItemValue('item', 'item', i) * 1;
                    nothingSWItemList.push({lineNum: i, itemId: itemId});
                }
            } 
        }
    }
    
    var allocItemListObj = getAllocDetails(nothingSWItemList);
    var errMsg = checkNotApprovedReason(recId, allocItemListObj);

    return errMsg;
}

function getDepartmentParentId(departmentId)
{
    var depRec = nlapiLoadRecord('department', departmentId);
    var parentDepId = depRec.getFieldValue('parent');
    var parentDepName = depRec.getFieldText('parent');

    return parentDepId;
}

function approveAllBackOrder(recId)
{
    var soRec = nlapiLoadRecord('salesorder', recId);
    
    var shipDate = soRec.getFieldValue('shipdate');
    var customerId = soRec.getFieldValue('entity');
    var departmentId = soRec.getFieldValue('department');
    if (departmentId) {
        var parentDepId = getDepartmentParentId(departmentId);
        if (parentDepId == 32) { // Sephora : SEA
            departmentId = parentDepId;
        }
    }
  
    var isChanged = false;
    var isShipDateChanged = false;
    var nothingSWItemList = [];
    var lineCount = soRec.getLineItemCount('item');
    for (var i = 1; i <= lineCount; i ++) {
        if (soRec.getLineItemValue('item', 'custcol_enable_alloc', i) == 'T') {
            var boQty = soRec.getLineItemValue('item', 'custcol_alloc_backorder_qty', i) * 1;
            if (boQty > 0) { 
                var shipWindow = soRec.getLineItemValue('item', 'custcol_item_alloc_shipwindow', i);
                if (shipWindow.indexOf('Nothing') > -1) {
                    var itemId = soRec.getLineItemValue('item', 'item', i) * 1;
                    dLog('itemId', itemId);
                    nothingSWItemList.push({lineNum: i, itemId: itemId});
                    soRec.setLineItemValue('item', 'custcol_backorder_fulfill', i, 'T');
                    soRec.setLineItemValue('item', 'custcol_backorder_fulfill_qty', i, boQty);
                    isChanged = true;
                } else {
                    soRec.setLineItemValue('item', 'custcol_backorder_fulfill', i, 'T');
                    soRec.setLineItemValue('item', 'custcol_backorder_fulfill_qty', i, boQty);
                    isChanged = true;
                }
            } 
        }
    }
/*    
    if (nothingSWItemList.length > 0) {
   //     var maxSWFromDate = shipDate;
        var allocItemListObj = getAllocDetails(nothingSWItemList);
   /*     for ( var k = 0; k < nothingSWItemList.length; k ++ ) {
              var itemId = nothingSWItemList[k].itemId;
              var shipWindowList = allocItemListObj[itemId];
              maxSWFromDate = getMaxSWFromDate(departmentId, customerId, shipWindowList, maxSWFromDate);
        }
        dLog('nothingSWItemList', JSON.stringify(nothingSWItemList));
        dLog('maxSWFromDate', maxSWFromDate);
        if (new Date(maxSWFromDate) >= new Date(shipDate)) {*/
 /*          for (var i = 0; i < nothingSWItemList.length; i ++) {
                var lineNum = nothingSWItemList[i].lineNum;
                soRec.setLineItemValue('item', 'custcol_enable_alloc', lineNum, 'F');
            }
 //           soRec.setFieldValue('shipdate', maxSWFromDate);
 //           isShipDateChanged = true;
 //       }
    }*/
    
    try {
        if (isChanged) {
            nlapiSubmitRecord(soRec, false, true);
        }
   /*     if (isShipDateChanged) {
            var newRecId = nlapiSubmitRecord(soRec, false, true);
            reprocessApproved(customerId, departmentId, newRecId);
        }*/
        dLog('nothingSWItemList', JSON.stringify(nothingSWItemList));
        var errMsg = '';
        if (nothingSWItemList.length > 0) {
            var allocItemListObj = getAllocDetails(nothingSWItemList);    
            errMsg = checkNotApprovedReason(recId, allocItemListObj);
        }
        return errMsg;    
    } catch ( error ) {
        if ( error.getDetails != undefined ) {
             nlapiLogExecution( "error", "Process Error1", error.getCode() + ":" + error.getDetails() );
             return error.getCode() + ":" + error.getDetails();
        } else {
             nlapiLogExecution( "error", "Unexpected Error", error.toString() );
             return error.toString();
        }
    }
    
    
}

function checkNotApprovedReason(recId, allocItemListObj)
{
    var errMsg = '';
    var isEntity = false;
    var isShipWindow = false;
    var soRec = nlapiLoadRecord('salesorder', recId);
    var shipDate = soRec.getFieldValue('shipdate');
    var customerId = soRec.getFieldValue('entity');
    var departmentId = soRec.getFieldValue('department');
    var lineCount = soRec.getLineItemCount('item');
    for (var i = 1; i <= lineCount; i ++) {
        if (soRec.getLineItemValue('item', 'custcol_enable_alloc', i) == 'T') {
            var itemId = soRec.getLineItemValue('item', 'item', i) * 1;
            var itemName = soRec.getLineItemText('item', 'item', i);
            var boQty = soRec.getLineItemValue('item', 'custcol_alloc_backorder_qty', i) * 1;
            var availQty = soRec.getLineItemValue('item', 'quantityavailable', i) * 1;
            if (!availQty) {
                errMsg += "Item " + itemName + " has 0 inventory quantity in Netsuite, Please adjust.\r\n";
            }
            
            if (boQty > 0) {
                var shipWindow = soRec.getLineItemValue('item', 'custcol_item_alloc_shipwindow', i);
                if (shipWindow.indexOf('Nothing') > -1) {
                    var shipWindowList = allocItemListObj[itemId];
                    if (shipWindowList != undefined && shipWindowList != 'undefined') {
                        for (var j = 0; j < shipWindowList.length; j ++)
                        {  
                            var element = shipWindowList[j];
                            var tmpCustomerId = element['customerId'];
                            var tmpDepartmentId = element['departmentId'];
                            var shipWindowId = element['shipWindowId'];
                            var fromDate = element['fromDate'];
                            var toDate = element['toDate'];
                            var allocQty = element['allocQty'] * 1;
                            var curAllocQty = element['curAllocQty'] * 1;
                            var totalOrderLegacy = element['totalOrderLegacy'] * 1;
                            var never_processed = element['never_processed'];
                            
                            if (tmpDepartmentId) {
                                baseId = departmentId;
                                compId = tmpDepartmentId;
                            } else {
                                baseId = customerId;
                                compId = tmpCustomerId;
                            }
                            
                            if (baseId == compId) {
                                isEntity = true;
                                if (fromDate != null && toDate != null && new Date(fromDate) <= new Date(shipDate) && new Date(shipDate) <= new Date(toDate)) {
                                    isShipWindow = true;
                                }
                            }
                        }
                    }
                    if (isEntity) {
                        if (!isShipWindow) {
                            errMsg += "This is no shipwindow for " + itemName + "\r\n";    
                        }
                    } else {
                        errMsg += "This is no shipwindow for " + itemName + " and has no setup for department or customer.\r\n";
                    }
                }
            }
        }
    }

    return errMsg;
}

function reprocessApproved(customerId, departmentId, newRecId)
{
    var isChanged = false;
    var soRec = nlapiLoadRecord('salesorder', newRecId);
    var lineCount = soRec.getLineItemCount('item');
    for (var i = 1; i <= lineCount; i ++) {
        if (soRec.getLineItemValue('item', 'custcol_enable_alloc', i) == 'T') {
            var shipWindow = soRec.getLineItemValue('item', 'custcol_item_alloc_shipwindow', i);
            var boQty = soRec.getLineItemValue('item', 'custcol_alloc_backorder_qty', i) * 1;
            if (shipWindow.indexOf('Nothing') == -1 && boQty > 0) { 
                soRec.setLineItemValue('item', 'custcol_backorder_fulfill', i, 'T');
                soRec.setLineItemValue('item', 'custcol_backorder_fulfill_qty', i, boQty);
                isChanged = true;
            } 
        }
    }
    
    if (isChanged) {
        nlapiSubmitRecord(soRec, false, true);
    }
}

function getMaxSWFromDate(departmentId, customerId, shipWindowList, maxSWFromDate)
{ 
    if (shipWindowList != undefined && shipWindowList != 'undefined') {
        for (var i = 0; i < shipWindowList.length; i ++)
        {  
            var element = shipWindowList[i];
            var tmpCustomerId = element['customerId'];
            var tmpDepartmentId = element['departmentId'];
            var shipWindowId = element['shipWindowId'];
            var fromDate = element['fromDate'];
            var toDate = element['toDate'];
                        
            if (tmpDepartmentId) {
                baseId = departmentId;
                compId = tmpDepartmentId;
            } else {
                baseId = customerId;
                compId = tmpCustomerId;
            }
          
            if (baseId == compId)
            {
                
                if (new Date(fromDate) > new Date(maxSWFromDate)) {
                    maxSWFromDate = fromDate;
                }
            }
        } 
    }

    return maxSWFromDate;
}

function getAllocDetails(nothingSWItemList)
{
    var itemIdList = [];
    for (var i = 0; i < nothingSWItemList.length; i ++) {
         itemIdList.push(nothingSWItemList[i].itemId);
    }

    var allocItemListObj = new Object;
    try {
        // resultIndex points to record starting current resultSet in the entire results array
        var search = nlapiLoadSearch( 'customrecord_item_alloc', 'customsearch_item_alloc_search' );
        var cols = search.getColumns();
        var newSearch = nlapiCreateSearch(search.getSearchType(), search.getFilters(), cols);
        newSearch.addFilter(new nlobjSearchFilter('custrecord_item_alloc_sku', null, 'anyOf', itemIdList));
        var searchResults = newSearch.runSearch();
        // resultIndex points to record starting current resultSet in the entire results array
        var resultIndex = 0;
        var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
        var resultSet; // temporary variable used to store the result set
        var allCount = 0;
        var oldItemId = 0;
        
        var shipWindowList = [];
        do
        {
            resultSet = searchResults.getResults(resultIndex, resultIndex + resultStep);
            for (var i = 0; i < resultSet.length; i ++) 
            {  
                var element = resultSet[i];
                var itemId = element.getValue(cols[1]);
                if (itemId != oldItemId) {
                    shipWindowList = [];
                }
                var itemObj = new Object;
                itemObj.itemId = itemId;
                itemObj.allocId = element.getId();
                itemObj.customerId = element.getValue(cols[0]);
                itemObj.customerName = element.getText(cols[0]);
                itemObj.itemName = element.getText(cols[1]);
                itemObj.locationId = element.getValue(cols[2]);
                itemObj.locationName = element.getText(cols[2]);
                itemObj.allocQty = element.getValue(cols[3]);
                itemObj.fromDate = element.getValue(cols[4]);
                itemObj.toDate = element.getValue(cols[5]);
                itemObj.shipWindowId = element.getValue(cols[6]);
                itemObj.recInvtotal = element.getValue(cols[7]);
                itemObj.dispName = element.getValue(cols[8]);
                itemObj.departmentId = element.getValue(cols[9]);
                itemObj.departmentName = element.getText(cols[9]);
                itemObj.totalOrderLegacy = element.getValue(cols[14]);
                itemObj.curAllocQty = element.getValue(cols[15]);
                itemObj.never_processed = element.getValue(cols[16]);
                itemObj.orderQty = 0;

                itemObj.allocQty = itemObj.allocQty * 1 - itemObj.totalOrderLegacy * 1;
                itemObj.curAllocQty = itemObj.curAllocQty * 1 - itemObj.totalOrderLegacy * 1;

                shipWindowList.push(itemObj);
                
                allocItemListObj[itemId] = shipWindowList;
                oldItemId = itemId;
            }
            resultIndex = resultIndex + resultStep;
     
        } while (resultSet.length > 0);

    } catch ( error ) {
        if ( error.getDetails != undefined ) {
          nlapiLogExecution( "error", "Process Error1", error.getCode() + ":" + error.getDetails() );
        } else {
          nlapiLogExecution( "error", "Unexpected Error", error.toString() );
        }
    }

    return allocItemListObj;
}

function dLog(title, detail)
{
    nlapiLogExecution('Debug', title, detail);
}