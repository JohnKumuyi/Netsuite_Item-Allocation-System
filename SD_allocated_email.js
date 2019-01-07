function scheduled(type)
{   
    var customerAllocList = getAllocDetailsAll();
    sendEmail(customerAllocList); 
}

function sendEmail(customerAllocList)
{   
    var fileId = 0;
    var contents = '';
    contents += "Item" + ",";
    contents += "Item description" + ",";
    contents += "STT Date" + ",";
    contents += "Department" + ",";
    contents += "Customer" + ",";
    contents += "Total allocated" + ",";
    contents += "Total ordered" + ",";
    contents += "Remaining to be ordered" + ",";
    contents += "Ship window from" + ",";
    contents += "Ship window to" + "\n";

    for (var i = 0; i < customerAllocList.length; i ++)
    {
        var itemAllocList = customerAllocList[i].detailArr;
        var itemAllocTotal = customerAllocList[i].itemAllocTotal * 1;
        for (var j = 0; j < itemAllocList.length; j ++) 
        {
            var element = itemAllocList[j];
            var allocId = element.allocId;
            var rangeId = element.rangeId;
            var itemId = element.itemId;
            var itemName = element.itemName;
            var dispName = element.dispName;
            var customerId = element.customerId;
            var departmentId = element.departmentId * 1;
            var departmentName = element.departmentName;
            var customerName = element.customerName;
            var locationId = element.locationId;
            var locationName = element.locationName;
            var allocQty = element.allocQty * 1;
            var orderQty = element.orderQty * 1;
            var legacyOrderQty = element.legacyOrderQty * 1;
            orderQty += legacyOrderQty;
            var beccaOrderQty = element.beccaOrderQty * 1;
            if (departmentId == 78 && beccaOrderQty > 0) {orderQty = beccaOrderQty;}
            var fromDate = element.fromDate;
            var toDate = element.toDate;

            var remainQty = (allocQty - orderQty) * 1;
            
            itemName = replaceColon(itemName);
            dispName = replaceColon(dispName);
            departmentName = replaceColon(departmentName);
            customerName = replaceColon(customerName);


            if (allocQty < 0) {
                allocQty = 0;
            }
            if (orderQty < 0) {
                orderQty = 0;
            }
            if (remainQty < 0) {
                remainQty = 0;
            }
            
            contents += "" + itemName + ",";
            contents += "" + dispName + ",";
            contents += "" + fromDate + ",";
            contents += "" + departmentName + ",";
            contents += "" + customerName + ",";
            contents += "" + allocQty + ",";
            contents += "" + orderQty + ",";
            contents += "" + remainQty + ",";
            contents += "" + fromDate + ",";
            contents += "" + toDate + "\n";
        }
    }    
    
    dLog('contents', contents);
    if (contents) {
       var file = nlapiCreateFile('so_allocated_qty_result.csv', 'CSV', contents);
       file.setFolder('-15');
       var fileId = nlapiSubmitFile(file);
       var senderID = 248482;
       var subject = 'Daily Item Allocation Report';
       var content = 'See item allocation report attachment below.';
     //  nlapiSendEmail(senderID, 'lwiener@beccacosmetics.com', subject, content, null, null, null, file);
      // nlapiSendEmail(senderID, 'kjzapps@gmail.com', subject, content, null, null, null, file);
       nlapiSendEmail(senderID, 'jkumuyi@axioma.com', subject, content, null, null, null, file);  
       nlapiSendEmail(senderID, 'codemanstar3@outlook.com', subject, content, null, null, null, file);
       
      var receiptList = [];
       receiptList.push('saahmed@beccacosmetics.com');
       receiptList.push('rbeach@beccacosmetics.com');
       receiptList.push('ncasimir@beccacosmetics.com');
       receiptList.push('lchishol@beccacosmetics.com');
       receiptList.push('fiodice@beccacosmetics.com');
       receiptList.push('tlepore@beccacosmetics.com');
       receiptList.push('erlopez@beccacosmetics.com');
       receiptList.push('nmarr@beccacosmetics.com');
       receiptList.push('laramos@beccacosmetics.com');
       receiptList.push('kreese@beccacosmetics.com');
       receiptList.push('cstumpo@beccacosmetics.com');
       receiptList.push('gantone@beccacosmetics.com');
       receiptList.push('saali@beccacosmetics.com');
       receiptList.push('ndesimon@beccacosmetics.com');
       receiptList.push('imakula@beccacosmetics.com');
       receiptList.push('jelarocc@beccacosmetics.com');
       receiptList.push('tvela@beccacosmetics.com');
       receiptList.push('savolett@beccacosmetics.com');
       receiptList.push('trbailey@beccacosmetics.com');
       receiptList.push('tecarter@beccacosmetics.com');
       receiptList.push('wensong@beccacosmetics.com');
       receiptList.push('scordone@beccacosmetics.com');
       receiptList.push('vkommuri@beccacosmetics.com');
       receiptList.push('tmatzner@beccacosmetics.com');
       receiptList.push('staha@beccacosmetics.com');
       receiptList.push('sadavis@beccacosmetics.com');
       receiptList.push('jduntonr@beccacosmetics.com');
       receiptList.push('mtravale@beccacosmetics.com');
       receiptList.push('rmontalt@beccacosmetics.com');
       receiptList.push('alombard@beccacosmetics.com');
       receiptList.push('ajaksch@beccacosmetics.com');
       receiptList.push('glombardi@bobbi-brown.co.uk');
       receiptList.push('ltessaro@bobbi-brown.co.uk'); 
   /*   
       for (var i = 0; i < receiptList.length; i ++)
       {
            nlapiSendEmail(senderID, receiptList[i], subject, content, null, null, null, file);     
       }*/
       dLog('contents1', senderID);
    } 
}

function replaceColon(strVar)
{
    var ret = strVar;
    if (ret && ret != 'null' && ret != undefined && ret != 'undefined') {
        ret = ret.replace(/,/gi, ".");
    } else {
        ret = '';
    }
    
    return ret;
}

function getAllocDetailsAll()
{
    var allocItemList = [];
    try {
        // resultIndex points to record starting current resultSet in the entire results array
        var search = nlapiLoadSearch( 'customrecord_item_alloc', 'customsearch_item_alloc_search' );
        var searchResults = search.runSearch();
        var cols = search.getColumns();
        // resultIndex points to record starting current resultSet in the entire results array
        var resultIndex = 0;
        var resultStep = 100; // Number of records returned in one step (maximum is 1000)
        var resultSet; // temporary variable used to store the result set

        do
        {
            resultSet = searchResults.getResults(resultIndex, resultIndex + resultStep);
            for (var i = 0; i < resultSet.length; i ++) 
            {   
                var element = resultSet[i];
                var itemObj = new Object;
                itemObj.allocId = element.getId();
                itemObj.customerId = element.getValue(cols[0]);
                itemObj.customerName = element.getText(cols[0]);
                itemObj.itemId = element.getValue(cols[1]);
                itemObj.itemName = element.getText(cols[1]);
                itemObj.locationId = element.getValue(cols[2]);
                itemObj.locationName = element.getText(cols[2]);
                itemObj.allocQty = element.getValue(cols[3]);
                itemObj.fromDate = element.getValue(cols[4]);
                itemObj.toDate = element.getValue(cols[5]);
                itemObj.rangeId = element.getValue(cols[6]);
                itemObj.recInvtotal = element.getValue(cols[7]);
                itemObj.dispName = element.getValue(cols[8]);
                itemObj.departmentId = element.getValue(cols[9]);
                itemObj.departmentName = element.getText(cols[9]);
                itemObj.sttDate = element.getValue(cols[10]);
                itemObj.recInvtotal1 = element.getValue(cols[11]);
                itemObj.sttDate1 = element.getValue(cols[12]); 
                itemObj.beccaOrderQty = element.getValue(cols[13]);
                itemObj.legacyOrderQty = element.getValue(cols[14]); 
                itemObj.orderQty = 0;

                var item_alloc_check = IsAllocationCheck(itemObj.itemId);
                if (item_alloc_check == 'T') {
                    allocItemList.push(itemObj);
                }

                if( (i % 5) == 0 ) {
                  setRecoveryPoint();
                }
                checkGovernance();
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

    var totalOrderObj = getItemTotalOrderAll();
    var depOrderObj = totalOrderObj.depOrderObj;
    var cusOrderObj = totalOrderObj.cusOrderObj;

    for (var i = 0; i < allocItemList.length; i ++)
    {   
        var itemId = allocItemList[i].itemId * 1;
        var departmentId = allocItemList[i].departmentId * 1;
        var customerId = allocItemList[i].customerId * 1;
        var fromDate = allocItemList[i].fromDate;
        var toDate = allocItemList[i].toDate;

        var itemObj = {};
        if (departmentId) {
            itemObj = depOrderObj[itemId];
        } else {
            itemObj = cusOrderObj[itemId];
        }      
       
        if (itemObj == undefined || itemObj == 'undefined'){
            continue;
        }
        
        var detailArr = {};
        if (departmentId) {
            detailArr = itemObj[departmentId];
        } else {
            detailArr = itemObj[customerId];
        }
        
        if (detailArr != undefined && detailArr != 'undefined')
        {
            for (var k = 0; k < detailArr.length; k ++)
            {
                var detailObj = detailArr[k];
                var shipWindow = detailObj['shipWindow'];
                var orderQty = detailObj['orderQty'] * 1;

                var tmpFromDate = '';
                var tmpToDate = '';
                if (shipWindow) {
                    var tmpArr = shipWindow.split(" ~ ");
                    if (tmpArr != undefined && tmpArr != 'undefined') {
                        if (tmpArr[0]  != undefined && tmpArr[0]  != 'undefined') {
                            tmpFromDate = tmpArr[0].split(' ')[1];    
                        }
                        if (tmpArr[1]  != undefined && tmpArr[1]  != 'undefined') {
                            tmpToDate = tmpArr[1].split(' ')[0];
                        }
                    }
                }
                
                if (fromDate == tmpFromDate && toDate == tmpToDate)
                {
                    allocItemList[i].orderQty += orderQty;
                }
            }
        }
    }

    var allocItemList = groupSameCustomersAll(allocItemList);
    return allocItemList;
}

function getItemTotalOrderAll()
{
    var totalOrderObj = new Object;
    var depOrderObj = new Object;
    var cusOrderObj = new Object;
    var depOrderTotalObj = new Object;
    var cusOrderTotalObj = new Object;
    var itemOrderObj = new Object;
    var depDetailArr = [];
    var oldDepartmentId = 0;
    var cusDetailArr = [];
    var oldCustomerId = 0;
    var oldItemDepId = 0;
    var oldItemCusId = 0;

    var search = nlapiLoadSearch( 'transaction', 'customsearch562_2' );
    var cols = search.getColumns();
    var searchResults = search.runSearch();

    var resultIndex = 0;
    var resultStep = 100; // Number of records returned in one step (maximum is 1000)
    var resultSet; // temporary variable used to store the result set

    do
    {
        resultSet = searchResults.getResults(resultIndex, resultIndex + resultStep);
        for (var i = 0; i < resultSet.length; i ++) 
        { 
            var element = resultSet[i];
            var itemId = element.getValue(cols[0]) * 1;
            var IsDepAllocated = element.getValue(cols[1]);
            var customerId = element.getValue(cols[2]);
            var departmentId = element.getValue(cols[3]);
            var shipWindow = element.getValue(cols[4]);
            var orderQty = element.getValue(cols[7]);
    
            if (IsDepAllocated == 'T') {
                var detailObj = new Object;
                detailObj.shipWindow = shipWindow;
                detailObj.orderQty = orderQty;

                if (oldDepartmentId != departmentId)
                {
                    depDetailArr = [];
                }

                if (oldItemDepId != itemId) {
                    depOrderObj = {};
                    depDetailArr = [];
                }
                
                depDetailArr.push(detailObj);
                
                depOrderObj[departmentId] = depDetailArr;
                depOrderTotalObj[itemId] = depOrderObj;

                oldDepartmentId = departmentId;
                oldItemDepId = itemId;
            } else {
                var detailObj = new Object;
                detailObj.shipWindow = shipWindow;
                detailObj.orderQty = orderQty;

                if (oldCustomerId != customerId)
                {
                    cusDetailArr = [];
                }
                if (oldItemCusId != itemId) {
                    cusOrderObj = {};
                    cusDetailArr = [];
                }

                cusDetailArr.push(detailObj);
                cusOrderObj[customerId] = cusDetailArr;
                cusOrderTotalObj[itemId] = cusOrderObj;

                oldCustomerId = customerId;
                oldItemCusId = itemId;
            }

            if( (i % 5) == 0 ) {
              setRecoveryPoint();
            }
            checkGovernance();
        }
        resultIndex = resultIndex + resultStep;
    } while (resultSet.length > 0);

    totalOrderObj.depOrderObj = depOrderTotalObj;
    totalOrderObj.cusOrderObj = cusOrderTotalObj;

  //  if (itemId == 12925 && departmentId == 32) {
            dLog('depOrderTotalObj', JSON.stringify(depOrderTotalObj));
  //          dLog('' + fromDate + ' => ' + toDate, '' + tmpFromDate + ' => ' + tmpToDate);
  //  } 
    return totalOrderObj;
}

function groupSameCustomersAll(allocItemList)
{
    var reportArr = [];
    var detailArr = [];
    var oldItemId = -1;
    var oldDepartmentId = -1;
    var oldCustomerId = -1;
    var detailCount = 0;
    var itemAllocTotal = 0;

    for (var i = 0; i < allocItemList.length; i ++)
    {
        var element = allocItemList[i];
        var itemId = element.itemId;
        var departmentId = element.departmentId;
        var customerId = element.customerId;
        var allocQty = element.allocQty * 1;
        
        if (departmentId) {
            if (oldItemId != itemId || oldDepartmentId != departmentId)
            {
                detailArr = [];
                itemAllocTotal = 0;
                detailCount ++;
            }

            detailArr[detailArr.length] = element;
            itemAllocTotal += allocQty;

            var detailObj = new Object;
            detailObj.detailArr = detailArr;
            detailObj.itemAllocTotal = itemAllocTotal;

            reportArr[detailCount - 1] = detailObj;
            oldDepartmentId = departmentId;
        }

        if (customerId) {
            if (oldItemId != itemId || oldCustomerId != customerId)
            {
                detailArr = [];
                itemAllocTotal = 0;
                detailCount ++;
            }

            detailArr[detailArr.length] = element;
            itemAllocTotal += allocQty;

            var detailObj = new Object;
            detailObj.detailArr = detailArr;
            detailObj.itemAllocTotal = itemAllocTotal;

            reportArr[detailCount - 1] = detailObj;
            oldCustomerId = customerId;     
        }
        
        oldItemId = itemId;
    }
    
    return reportArr;
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
    }

    return chkVal;
}

/*============================================ Log =========================================*/
function dLog(title, details)
{
    nlapiLogExecution('Debug', title, details);
}

function checkGovernance()
{
 var context = nlapiGetContext();
 if( context.getRemainingUsage() < 200 )
 {
    var state = nlapiYieldScript();
    if( state.status == 'FAILURE')
    {
        nlapiLogExecution("ERROR","Failed to yield script, exiting: Reason = "+state.reason + " / Size = "+ state.size);
        throw "Failed to yield script";
    } 
    else if ( state.status == 'RESUME' )
    {
         nlapiLogExecution("AUDIT", "Resuming script because of " + state.reason+".  Size = "+ state.size);
    }
  // state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
 }
}

function setRecoveryPoint()
{
 var state = nlapiSetRecoveryPoint(); //100 point governance
 if( state.status == 'SUCCESS' ) {
    nlapiLogExecution("Audit", "Recovery Point Success");
    return;  //we successfully create a new recovery point
 }
 if( state.status == 'RESUME' ) //a recovery point was previously set, we are resuming due to some unforeseen error
 {
    nlapiLogExecution("ERROR", "Resuming script because of " + state.reason+".  Size = "+ state.size);
 //   handleScriptRecovery();
 }
 else if ( state.status == 'FAILURE' )  //we failed to create a new recovery point
 {
     nlapiLogExecution("ERROR","Failed to create recovery point. Reason = "+state.reason + " / Size = "+ state.size);
     handleRecoveryFailure(state);
 }
}

function handleRecoverFailure(failure)
{
     if( failure.reason == 'SS_MAJOR_RELEASE' ) throw "Major Update of NetSuite in progress, shutting down all processes";
     if( failure.reason == 'SS_CANCELLED' ) throw "Script Cancelled due to UI interaction";
     if( failure.reason == 'SS_EXCESSIVE_MEMORY_FOOTPRINT' ) { cleanUpMemory(); setRecoveryPoint(); }//avoid infinite loop
     if( failure.reason == 'SS_DISALLOWED_OBJECT_REFERENCE' ) throw "Could not set recovery point because of a reference to a non-recoverable object: "+ failure.information; 
}

function cleanUpMemory(){
     nlapiLogExecution("Debug", "Cleanup_Memory", "Cleanup_Memory");
}