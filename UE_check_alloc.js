function AfterSubmit(type)
{   
    dLog('type', type);
    if (type == 'create' || type == 'edit' || type == 'cancel')
    {
        var context = nlapiGetContext();
        var executionContext = context.getExecutionContext();

        var soRec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
        if (type == 'edit') {
            var oldRec = nlapiGetOldRecord();
            checkDeletedLineItems(oldRec, soRec);
        }
 
        var orderStatus = soRec.getFieldText('orderstatus');
        dLog('orderStatus', orderStatus);
      
        var shipDate = soRec.getFieldValue('shipdate');
        var entity = soRec.getFieldValue('entity');
        var department = soRec.getFieldValue('department') * 1;
        var location = soRec.getFieldValue('location');

        if (department == 19 || location != 1 ) {
            return;
        }
        
        if (department) {
            var parentDepId = getDepartmentParentId(department);
            if (parentDepId == 32) { // Sephora : SEA
                department = parentDepId;
            }
        }
        
        var newAllocList = [];
        var allocItemListObj = getAllocDetailsAll();
        var backOrderedCnt = 0;
        var lineNum = soRec.getLineItemCount('item');
        for (var i = lineNum; i >= 1; i -- )
        {
            var itemId = soRec.getLineItemValue('item', 'item', i);
            var availQty = soRec.getLineItemValue('item', 'quantityavailable', i) * 1;
       /*     if (!availQty) {
                continue;
            }*/
            var orderQty = soRec.getLineItemValue('item', 'quantity', i) * 1;
            var backOrderedQty = soRec.getLineItemValue('item', 'custcol_alloc_backorder_qty', i) * 1;
            var boFulfillQty = soRec.getLineItemValue('item', 'custcol_backorder_fulfill_qty', i) * 1;
            var IsAllocated = soRec.getLineItemValue('item', 'custcol_enable_alloc', i);
            var prepare_BOFulfill = soRec.getLineItemValue('item', 'custcol_backorder_fulfill', i);
            var IsBOFulfilled = soRec.getLineItemValue('item', 'custcol_backorder_fulfilled', i);
            var IsClosed = soRec.getLineItemValue('item', 'isclosed', i);
                    
            if (orderStatus == 'Cancelled' || orderStatus == 'Closed' || IsClosed == 'T') {
                var shipWindowId = soRec.getLineItemValue('item', 'custcol_shipwindowid', i);
                if ((!isEmpty(shipWindowId) && shipWindowId * 1 > 0) || IsAllocated == 'T') {
                    processRemoveAlloc(soRec, i, shipWindowId);
                }
                continue;
            } 

            if (IsBOFulfilled == 'T') {
                continue;
            }
            if (IsAllocated == 'F') {
                var item_alloc_check = IsAllocationCheck(itemId);
                if (item_alloc_check == 'T' && entity && itemId/* && location*/)
                { 
                    var procRetObj = processAlloc(allocItemListObj, soRec, shipDate, entity, department, itemId, location, orderQty, i);
                    var IsBackOrdered = procRetObj.IsBackOrdered;
                    for (var k = 0; k < procRetObj.newAllocList.length; k++) {
                        newAllocList.push({shipWindowId: procRetObj.newAllocList[k].shipWindowId, newAllocQty: procRetObj.newAllocList[k].newAllocQty});
                    }
                    if (IsBackOrdered) {backOrderedCnt++;}
                }
            } else {
                if (IsAllocated == 'T' && prepare_BOFulfill == 'T' && orderQty > 0 && backOrderedQty > 0 && boFulfillQty > 0)
                {
                    updateBackOrderFulfillQty(soRec, i, itemId, orderQty, boFulfillQty);
                }
            }
        }
        
        if (orderStatus != 'Cancelled' && orderStatus != 'Closed')
        {
            if (executionContext == 'webservices') {
                if (backOrderedCnt > 0) {
                    soRec.setFieldText('orderstatus', 'Pending Approval');
                } else {
                    if (checkItemStartWithS(soRec)) {
                        soRec.setFieldText('orderstatus', 'Pending Approval');
                    } else {
                        soRec.setFieldText('orderstatus', 'Pending Fulfillment');
                    }
                }
            }
        }
        nlapiSubmitRecord(soRec, false, true);
        updateAllShipWindowAllocQty(newAllocList);
        
    } else if (type == 'delete') {

       var soRec = nlapiGetOldRecord();
       var lineNum = soRec.getLineItemCount('item');
       for (var i = lineNum; i >= 1; i -- )
       {
            var orderQty = soRec.getLineItemValue('item', 'quantity', i) * 1;
            var IsAllocated = soRec.getLineItemValue('item', 'custcol_enable_alloc', i);
            var shipWindowId = soRec.getLineItemValue('item', 'custcol_shipwindowid', i);
            if ((!isEmpty(shipWindowId) && shipWindowId * 1 > 0) || IsAllocated == 'T') {
                processRemoveAlloc(soRec, i, shipWindowId);
            }
       }
    }
}

function updateAllShipWindowAllocQty(newAllocList){
    for (var i = 0; i < newAllocList.length; i ++)  {
        updateShipWindowAllocQty(newAllocList[i].shipWindowId, newAllocList[i].newAllocQty);
    }
    dLog('UpdateAllShipWindow', newAllocList.length);
}

function checkItemStartWithS(soRec)
{
    var lineNum = soRec.getLineItemCount('item');
    for (var i = lineNum; i >= 1; i -- )
    {
        var itemName = soRec.getLineItemText('item', 'item', i);
        if (itemName && itemName.length >= 2) {
            var startWord = itemName.substr(0, 2);
            if (startWord == 'S-') {
                return true;
            }   
        }
    }
    return false;
}

function checkDeletedLineItems(oldRec, curRec)
{
    var lineNum = oldRec.getLineItemCount('item');
    for (var i = lineNum; i >= 1; i -- )
    {
        var lineNumber = oldRec.getLineItemValue('item', 'line', i);
        var IsSame = getSameLineWithOld(lineNumber, curRec);
        if (!IsSame) {
            var orderQty = oldRec.getLineItemValue('item', 'quantity', i) * 1;
            var IsAllocated = oldRec.getLineItemValue('item', 'custcol_enable_alloc', i);
            var shipWindowId = oldRec.getLineItemValue('item', 'custcol_shipwindowid', i);
            if ((!isEmpty(shipWindowId) && shipWindowId * 1 > 0) || IsAllocated == 'T') {
                processRemoveAlloc(oldRec, i, shipWindowId);
            }
        }
    }
}

function getSameLineWithOld(lineNumber, curRec)
{
    var lineNum = curRec.getLineItemCount('item');
    for (var i = lineNum; i >= 1; i -- )
    {
        var oldLineNumber = curRec.getLineItemValue('item', 'line', i);
        if (lineNumber == oldLineNumber) {
            return true;
        }
    }
    return false;
}

function processRemoveAlloc(soRec, lineIndex, shipWindowId)
{
    var allocatedQty = soRec.getLineItemValue('item', 'custcol_allocatedqty', lineIndex) * 1;
    if (allocatedQty > 0) {
        soRec.setLineItemValue('item', 'custcol_item_alloc_total_ordered_qty', lineIndex, 0);
        soRec.setLineItemValue('item', 'custcol_allocatedqty', lineIndex, 0);
        soRec.setLineItemValue('item', 'custcol_alloc_backorder_qty', lineIndex, 0);
        soRec.setLineItemValue('item', 'custcol_enable_alloc', lineIndex, 'F');
        soRec.setLineItemValue('item', 'custcol_is_department_alloc', lineIndex, 'F');
        soRec.setLineItemValue('item', 'commitinventory', lineIndex, 1);
        soRec.setLineItemValue('item', 'custcol_item_alloc_shipwindow', lineIndex, '');
        soRec.setLineItemValue('item', 'custcol_shipwindowid', lineIndex, '');
        soRec.setLineItemValue('item', 'custcol_old_order_update', lineIndex, 'F');

        if (shipWindowId * 1 > 0) {
            var allocRec = nlapiLoadRecord('customrecord_item_alloc_date_range', shipWindowId);
            var curAllocQty = allocRec.getFieldValue('custrecord_cur_alloc_qty');
            var itemAllocQty = allocRec.getFieldValue('custrecord_item_alloc_qnty');
            if (!isEmpty(curAllocQty) && !isEmpty(itemAllocQty)) {
                curAllocQty = curAllocQty * 1 + allocatedQty * 1;
                itemAllocQty = itemAllocQty * 1;
                if (curAllocQty >= itemAllocQty) {
                    curAllocQty = itemAllocQty;
                    allocRec.setFieldValue('custrecord_never_processed_yet', 'T');
                }
                allocRec.setFieldValue('custrecord_cur_alloc_qty', curAllocQty);
                dLog('RemoveAlloc', curAllocQty);
            }
            nlapiSubmitRecord(allocRec, false, true);
        }
    }
}

function getAllocDetailsAll()
{
    var allocItemListObj = new Object;
    try {
        // resultIndex points to record starting current resultSet in the entire results array
        var search = nlapiLoadSearch( 'customrecord_item_alloc', 'customsearch_item_alloc_search' );
        var searchResults = search.runSearch();
        var cols = search.getColumns();
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

function processAlloc(allocItemListObj, soRec, shipDate, customerId, departmentId, itemId, location, orderQty, lineIndex)
{ 
   var IsBackOrdered = false;
   var isAllocProcessed = false;
   var newAllocList = [];
   
   var shipWindowList = allocItemListObj[itemId];
   if (shipWindowList != undefined && shipWindowList != 'undefined') {
        for (var i = 0; i < shipWindowList.length; i ++)
        {  
            var element = shipWindowList[i];
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
                IsDepartmentAlloc = 'T';
                baseId = departmentId;
                compId = tmpDepartmentId;
            } else {
                IsDepartmentAlloc = 'F';
                baseId = customerId;
                compId = tmpCustomerId;
            }
        
            if (never_processed != 'T') {
                allocQty = curAllocQty;
            }
            
            if (baseId == compId && fromDate != null && toDate != null && new Date(fromDate) <= new Date(shipDate) && new Date(shipDate) <= new Date(toDate))
            {
                var shipWindowData = '( ' + fromDate + ' ~ ' + toDate + ' )';
                if (allocQty*1 <= 0) {
                    processBackOrder(soRec, lineIndex, orderQty, shipWindowId, shipWindowData, IsDepartmentAlloc);
                    IsBackOrdered = true;
                } else {
                    if (orderQty*1 > allocQty*1)
                    {
                        var line = soRec.getLineItemValue('item', 'line', lineIndex);
                        soRec.setLineItemValue('item', 'custcol_item_alloc_total_ordered_qty', lineIndex, orderQty);
                        soRec.setLineItemValue('item', 'quantity', lineIndex, allocQty);
                        soRec.setLineItemValue('item', 'commitinventory', lineIndex, 1);
                        soRec.setLineItemValue('item', 'custcol_allocatedqty', lineIndex, allocQty);
                        soRec.setLineItemValue('item', 'custcol_alloc_backorder_qty', lineIndex, null);
                        soRec.setLineItemValue('item', 'custcol_enable_alloc', lineIndex, 'T');
                        soRec.setLineItemValue('item', 'custcol_is_department_alloc', lineIndex, IsDepartmentAlloc);
                        soRec.setLineItemValue('item', 'custcol_item_alloc_shipwindow', lineIndex, shipWindowData);
                        soRec.setLineItemValue('item', 'custcol_shipwindowid', lineIndex, shipWindowId);
                        soRec.setLineItemValue('item', 'custcol_backorder_fulfill', lineIndex, 'F');
                        soRec.setLineItemValue('item', 'custcol_backorder_fulfill_qty', lineIndex, null);
                        soRec.commitLineItem('item');  
                      
                        soRec.selectNewLineItem('item');
                        soRec.setCurrentLineItemValue('item', 'item', itemId);
                        soRec.setCurrentLineItemValue('item', 'quantity', (orderQty - allocQty)*1);
                        soRec.setCurrentLineItemValue('item', 'custcol_alloc_backorder_qty', (orderQty - allocQty)*1);
                        soRec.setCurrentLineItemValue('item', 'custcol_qtyremaining', (allocQty - orderQty)*1);
                        soRec.setCurrentLineItemValue('item', 'rate', 0);
                        soRec.setCurrentLineItemValue('item', 'amount', 0);
                        soRec.setCurrentLineItemValue('item', 'commitinventory', 3);
                        soRec.setCurrentLineItemValue('item', 'custcol_enable_alloc', 'T');
                        soRec.setCurrentLineItemValue('item', 'custcol_is_department_alloc', IsDepartmentAlloc);
                        soRec.setCurrentLineItemValue('item', 'custcol_item_alloc_shipwindow', shipWindowData);
                        soRec.setCurrentLineItemValue('item', 'custcol_shipwindowid', shipWindowId);
                        soRec.setCurrentLineItemValue('item', 'custcol_parent_line', line);
                        soRec.commitLineItem('item');

                        newAllocList.push({shipWindowId: shipWindowId, newAllocQty: 0});
                        IsBackOrdered = true;
                    }
                    else
                    {   
                        var shipWindowData = '( ' + fromDate + ' ~ ' + toDate + ' )';
                        soRec.setLineItemValue('item', 'custcol_item_alloc_total_ordered_qty', lineIndex, orderQty);
                        soRec.setLineItemValue('item', 'custcol_allocatedqty', lineIndex, orderQty);
                        soRec.setLineItemValue('item', 'custcol_alloc_backorder_qty', lineIndex, null);
                        soRec.setLineItemValue('item', 'custcol_enable_alloc', lineIndex, 'T');
                        soRec.setLineItemValue('item', 'custcol_is_department_alloc', lineIndex, IsDepartmentAlloc);
                        soRec.setLineItemValue('item', 'custcol_item_alloc_shipwindow', lineIndex, shipWindowData);
                        soRec.setLineItemValue('item', 'commitinventory', lineIndex, 1);
                        soRec.setLineItemValue('item', 'custcol_shipwindowid', lineIndex, shipWindowId);
                        soRec.setLineItemValue('item', 'custcol_backorder_fulfill', lineIndex, 'F');
                        soRec.setLineItemValue('item', 'custcol_backorder_fulfill_qty', lineIndex, null);

                        var newAllocQty = allocQty - orderQty + totalOrderLegacy;
                        newAllocList.push({shipWindowId: shipWindowId, newAllocQty: newAllocQty});
                    }
                }
           
                isAllocProcessed = true;
                break;
            }
        } 
   }
  
   if (!isAllocProcessed) {
        processBackOrder(soRec, lineIndex, orderQty, 0, '( Nothing )', IsDepartmentAlloc);
        IsBackOrdered = true;
   }
    
    var retObj = new Object;
    retObj.newAllocList = newAllocList;
    retObj.IsBackOrdered = IsBackOrdered;

    return retObj;
}


function updateBackOrderFulfillQty(soRec, lineIndex, itemId, orderQty, boFulfillQty)
{
    var parentLine = soRec.getLineItemValue('item', 'custcol_parent_line', lineIndex);
    var line = soRec.getLineItemValue('item', 'line', lineIndex);
    var itemRate = soRec.getLineItemValue('item', 'rate', lineIndex);
    var totalOrderQty = soRec.getLineItemValue('item', 'custcol_item_alloc_total_ordered_qty', lineIndex) * 1;
    var backOrderQty = soRec.getLineItemValue('item', 'custcol_alloc_backorder_qty', lineIndex) * 1;
    var shipWindowId = soRec.getLineItemValue('item', 'custcol_shipwindowid', lineIndex);
    var shipWindowData = soRec.getLineItemValue('item', 'custcol_item_alloc_shipwindow', lineIndex);
    var is_backOrderQty_fulfill_processed = soRec.getLineItemValue('item', 'custcol_backorder_qty_fulfill_process', lineIndex);
    
    if (is_backOrderQty_fulfill_processed != 'T') {
        orderQty = backOrderQty;
    }
    
    soRec.setLineItemValue('item', 'custcol_backorder_fulfill', lineIndex, 'F');
    soRec.setLineItemValue('item', 'quantity', lineIndex, (orderQty*1 - boFulfillQty*1));
    soRec.setLineItemValue('item', 'custcol_backorder_fulfill_qty', lineIndex, null);
    soRec.setLineItemValue('item', 'custcol_backorder_qty_fulfill_process', lineIndex, 'T');
    soRec.commitLineItem('item');
    dLog('orderQty - boFulfillQty', (orderQty*1 - boFulfillQty*1));

    if (parentLine) {
        updateParentLineQty(soRec, parentLine, boFulfillQty);
        if (orderQty*1 <= boFulfillQty*1) {
            soRec.removeLineItem('item', lineIndex);
            dLog('orderQty - boFulfillQty - 1', (orderQty*1 - boFulfillQty*1));
        }    
    } else {
        if (orderQty*1 <= boFulfillQty*1) {
            soRec.setLineItemValue('item', 'quantity', lineIndex, totalOrderQty);
            soRec.setLineItemValue('item', 'custcol_allocatedqty', lineIndex, totalOrderQty);
            soRec.setLineItemValue('item', 'commitinventory', lineIndex, 1);
            soRec.setLineItemValue('item', 'custcol_alloc_backorder_qty', lineIndex, null);
            dLog('orderQty - boFulfillQty - 2', (orderQty*1 - boFulfillQty*1));
        }    
    }
}

function updateParentLineQty(soRec, parentLine, boFulfillQty)
{
    var lineNum = soRec.getLineItemCount('item');
    for (var i = 1; i <= lineNum; i ++ )
    {
        var IsAllocated = soRec.getLineItemValue('item', 'custcol_enable_alloc', i);
        var itemId = soRec.getLineItemValue('item', 'item', i);
        var line = soRec.getLineItemValue('item', 'line', i);
        var qty = soRec.getLineItemValue('item', 'quantity', i) * 1;
        qty += boFulfillQty * 1;
        var allocatedQty = soRec.getLineItemValue('item', 'custcol_allocatedqty', i) * 1;
        allocatedQty += boFulfillQty * 1;

        if (IsAllocated == 'T' && line == parentLine) {
            soRec.setLineItemValue('item', 'custcol_backorder_qty_fulfill_process', i, 'T');
            soRec.setLineItemValue('item', 'commitinventory', i, 1);
            soRec.setLineItemValue('item', 'quantity', i, qty);
            soRec.setLineItemValue('item', 'custcol_allocatedqty', i, allocatedQty);
            soRec.setLineItemValue('item', 'custcol_backorder_fulfill', i, 'F');
            soRec.setLineItemValue('item', 'custcol_backorder_fulfill_qty', i, null);
            soRec.commitLineItem('item');
            break;
        }
    }
}

function IsAllocationCheck(itemId)
{
    var chkVal = 'F';

    var filters = [];
    filters[0] = new nlobjSearchFilter( 'internalid', null, 'is', itemId );
    
    var columns = [];
    columns[0] = new nlobjSearchColumn( 'custitem_item_alloc_check' );
     
    var searchresults = nlapiSearchRecord( 'item', null, filters, columns );
    
    if ( searchresults != null && searchresults.length > 0 ) 
    {
       var element = searchresults[ 0 ];
       var recId = element.getId();
       var recType = element.getRecordType();
       chkVal = element.getValue(columns[0]);
       nlapiLogExecution('Debug', 'RecordID', recId);
       nlapiLogExecution('Debug', 'RecordType', recType);
    }

    return chkVal;
}

function processBackOrder(soRec, lineIndex, orderQty, shipWindowId, shipWindowData, IsDepartmentAlloc)
{
    soRec.setLineItemValue('item', 'custcol_item_alloc_total_ordered_qty', lineIndex, orderQty);
    soRec.setLineItemValue('item', 'custcol_allocatedqty', lineIndex, null);
    soRec.setLineItemValue('item', 'custcol_alloc_backorder_qty', lineIndex, orderQty);
    soRec.setLineItemValue('item', 'custcol_enable_alloc', lineIndex, 'T');
    soRec.setLineItemValue('item', 'custcol_item_alloc_shipwindow', lineIndex, shipWindowData);
    soRec.setLineItemValue('item', 'commitinventory', lineIndex, 3);
    soRec.setLineItemValue('item', 'custcol_shipwindowid', lineIndex, shipWindowId);
    soRec.setLineItemValue('item', 'custcol_is_department_alloc', lineIndex, IsDepartmentAlloc);
    soRec.setLineItemValue('item', 'custcol_backorder_fulfill', lineIndex, 'F');
    soRec.setLineItemValue('item', 'custcol_backorder_fulfill_qty', lineIndex, null);
    dLog('Process Backorder', 'TRUE');
}

function updateShipWindowAllocQty(rangeRecId, qty)
{
    var allocRec = nlapiLoadRecord('customrecord_item_alloc_date_range', rangeRecId);
    dLog('UpdateOneShipWindow', qty);
    allocRec.setFieldValue('custrecord_cur_alloc_qty', qty);
    allocRec.setFieldValue('custrecord_never_processed_yet', 'F');
    nlapiSubmitRecord(allocRec, false, true);
}

function getDepartmentParentId(departmentId)
{
    var depRec = nlapiLoadRecord('department', departmentId);
    var parentDepId = depRec.getFieldValue('parent');
    var parentDepName = depRec.getFieldText('parent');

    return parentDepId;
}

function isEmpty(fldValue)
{
    if (fldValue == '') return true;
    if (fldValue == 'null') return true;
    if (fldValue == null) return true;
    if (fldValue == 'undefined') return true;
    if (fldValue == undefined) return true;
    if (fldValue.length < 1) return true;
    
    return false;
}

function dLog(title, detail)
{
    nlapiLogExecution('Debug', title, detail);
}

function BeforeLoad(type, form)
{
    if (type == 'copy')
    {
        var lineNum = nlapiGetLineItemCount('item');
        for (var i = lineNum; i >= 1; i -- )
        {
            var totalOrderQty = nlapiGetLineItemValue('item', 'custcol_item_alloc_total_ordered_qty', i) * 1;
            var backOrderQty = nlapiGetLineItemValue('item', 'custcol_alloc_backorder_qty', i) * 1;
            
            if (totalOrderQty > 0 || backOrderQty > 0) {
                if (totalOrderQty > 0) {
                    nlapiSetLineItemValue('item', 'custcol_enable_alloc', i, 'F');
                    nlapiSetLineItemValue('item', 'custcol_is_department_alloc', i, 'F');
                    nlapiSetLineItemValue('item', 'custcol_old_order_update', i, 'F');
                    nlapiSetLineItemValue('item', 'custcol_item_alloc_total_ordered_qty', i, null);
                    nlapiSetLineItemValue('item', 'custcol_allocatedqty', i, null);
                    nlapiSetLineItemValue('item', 'custcol_alloc_backorder_qty', i, null);
                    nlapiSetLineItemValue('item', 'custcol_qtyremaining', i, null);
                    nlapiSetLineItemValue('item', 'commitinventory', i, 1);
                    nlapiSetLineItemValue('item', 'custcol_item_alloc_shipwindow', i, null);
                    nlapiSetLineItemValue('item', 'custcol_shipwindowid', i, null);
                } else {
                    nlapiRemoveLineItem('item', i);    
                }
            }
        }
    } else if (type == 'view') {
        var isExist = false;
        var lineNum = nlapiGetLineItemCount('item');
        for (var i = lineNum; i >= 1; i -- )
        {
            var backOrderQty = nlapiGetLineItemValue('item', 'custcol_alloc_backorder_qty', i) * 1;
            if (backOrderQty > 0) {
                isExist = true;
                break;
            }
        }
        if (isExist) {
            form.addButton('custpage_all_bo_approved', 'All BackOrder Approved', "allBackOrderApproved()");
        }
        form.setScript('customscript_cs_item_alloc');
    }
}