function scheduled(type)
{   
    var upload_file_name = nlapiGetContext().getSetting('SCRIPT', 'custscript_upload_file_name');
    var statusObj = createAllocation();
    sendEmail(upload_file_name, statusObj); 
}

function sendEmail(upload_file_name, statusObj)
{   
    var contents = statusObj.entireStatus;
    var successCount = statusObj.successCount;
    var failedCount = statusObj.failedCount;
    if (contents) {
       var file = nlapiCreateFile('item_allocation_upload_result.csv', 'CSV', contents);
       file.setFolder('-15');
       var fileId = nlapiSubmitFile(file);
       var senderID = 248482;
       var nowDate = new Date();
       var estDate = new Date( nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate(), nowDate.getUTCHours()-4, nowDate.getUTCMinutes(), nowDate.getUTCSeconds() );
       var year = estDate.getFullYear();
       var month = estDate.getMonth();
       var date = estDate.getDate();
       var importDate = month + '/' + date + '/' + year;
       var subject = 'Item Allocation CSV Import Notification'  + ' TEST' ;
       var content = 'Thank you for using the Item Allocation CSV Import Assistant. The status of your import is Completed.<BR><BR><BR>';
       content += 'File Name : ' + upload_file_name + '<BR>';
       content += 'Date and time of import : ' + importDate + '<BR>';
       content += 'Number of records imported : ' + successCount + '<BR>';
       content += 'Number of records not imported : ' + failedCount;

       var context = nlapiGetContext();
       var userEmail = context.getEmail();
       dLog('userEmail', userEmail);
       nlapiSendEmail(senderID, userEmail, subject, content, null, null, null, file);  
       nlapiSendEmail(senderID, 'Jkumuyi@axioma.com', subject, content, null, null, null, file);
       nlapiSendEmail(senderID, 'kjzapps@gmail.com', subject, content, null, null, null, file);
       nlapiSendEmail(senderID, 'codemanstar3@outlook.com', subject, content, null, null, null, file);  
    } 
}

function createAllocation()
{
    var file = nlapiLoadFile(170341);
    var json_data = file.getValue();
    var saveList = JSON.parse(json_data);   
    var allocDetails = getAllocDetailsAll();
    
    var statusObj = new Object;
    var strEntireStatus = '';
    var successCount = 0;
    var failedCount = 0;

    for (var i = 0; i < saveList.length; i ++)
    {
        if( (i % 5) == 0 ) {
          setRecoveryPoint();
        }
        checkGovernance();
        
        var lineNumber = i + 2;
        var element = saveList[i];
        var strErrMsg = validateEntry(element);
        if (strErrMsg) {
            strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + strErrMsg + "\n";
            failedCount ++;
            continue;
        } 
        var itemId = element['itemId'];
        var itemName = element['itemName'];
        var invAllocTotal = element['invAllocTotal'] * 1;
        var department = element['department'];     
        var customer = element['customer'];     
        var allocQty = element['allocQty'] * 1;     
        var fromDate = element['fromDate'];     
        var toDate = element['toDate'];
        var departmentId = null;
        var customerId = null;
        if (department) {
            departmentId = getDepartmentId(department);
        }
        if (customer) {
            customerId = getCustomerId(customer);
        }

        if (!departmentId && !customerId) {
            strEntireStatus += 'Failed Line # : ' + lineNumber + ' => Invalid Department or Customer.\n';
            failedCount ++;
            continue;
        }

        var retObj = getSameAllocation(allocDetails, itemId, department, customerId, fromDate, toDate)
        var allocId = retObj.allocId;
        var rangeId = retObj.rangeId;
        if (rangeId) {
            nlapiSubmitField('customrecord_item_alloc_date_range', rangeId, ['custrecord_alloc_department', 'custrecord_alloc_customer', 'custrecord_item_alloc_qnty'], [departmentId, customerId, allocQty] );
        } else {
            if (!allocId) {
                var allocRec = nlapiCreateRecord('customrecord_item_alloc');
                allocRec.setFieldValue('custrecord_item_alloc_sku', itemId);
                try {
                    allocId = nlapiSubmitRecord(allocRec, false, true);
                    checkAllocItem(itemId);
                } catch ( error ) {
                    if ( error.getDetails != undefined ) {
                        strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + error.getDetails() + '\n';
                        failedCount ++;
                        continue;
                        nlapiLogExecution( "error", "Process Error", error.getCode() + ":" + error.getDetails() );
                    } else {
                        strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + error.toString() + '\n';
                        failedCount ++;
                        continue;
                        nlapiLogExecution( "error", "Unexpected Error", error.toString() );
                    }
                }
            }
            var rangeRec = nlapiCreateRecord('customrecord_item_alloc_date_range');
            rangeRec.setFieldValue('custrecord_item_alloc_date_range_entity', allocId);
            rangeRec.setFieldValue('custrecord_item_alloc_qnty', allocQty);
            rangeRec.setFieldValue('custrecord_item_alloc_date_range_from', fromDate);
            rangeRec.setFieldValue('custrecord_item_alloc_date_range_to', toDate);
            rangeRec.setFieldValue('custrecord_alloc_department', departmentId);
            rangeRec.setFieldValue('custrecord_alloc_customer', customerId);    
            
            try {
                nlapiSubmitRecord(rangeRec, false, true);
            } catch ( error ) {
                if ( error.getDetails != undefined ) {
                    strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + error.getDetails() + '\n';
                    failedCount ++;
                    continue;
                    nlapiLogExecution( "error", "Process Error", error.getCode() + ":" + error.getDetails() );
                } else {
                    strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + error.toString() + '\n';
                    failedCount ++;
                    continue;
                    nlapiLogExecution( "error", "Unexpected Error", error.toString() );
                }
            }
        }
        if (allocId && invAllocTotal) {
            nlapiSubmitField('customrecord_item_alloc', allocId, ['custrecord_item_alloc_total'], [invAllocTotal] );    
        }
        strEntireStatus += 'Success Line # : ' + lineNumber + '\n';
        successCount ++;
    } 

    strEntireStatus += '\n';
    strEntireStatus += '\n';
    strEntireStatus += 'Success : ' + successCount;
    strEntireStatus += '\n';
    strEntireStatus += 'Failed : ' + failedCount;

    statusObj.entireStatus = strEntireStatus;
    statusObj.successCount = successCount;
    statusObj.failedCount = failedCount;

    return statusObj;
}

function validateEntry(element)
{
    var strErrMsg = '';
    var itemId = element['itemId'];
    var department = element['department'];     
    var customer = element['customer'];     

 /*   var invAllocTotal = element['invAllocTotal'];
    if (!validateNumber(invAllocTotal)) {
       strErrMsg += ', Inventory Allocation Total';     
    } */
    var allocQty = element['allocQty'];     
    if (!validateNumber(allocQty)) {
       strErrMsg += ', Allocation Qty';     
    }
    var fromDate = element['fromDate'];   
    if (!validateDate(fromDate)) {
        strErrMsg += ', From Date';        
    }  
    var toDate = element['toDate'];
    if (!validateDate(toDate)) {
        strErrMsg += ', To Date';        
    }

    if (strErrMsg.length > 0) {
        strErrMsg = strErrMsg.substr(2, strErrMsg.length - 2);
    }
    return strErrMsg;
}

function validateNumber(number)
{
    if (isEmpty(number) || isNaN(number) || number * 1 == 0) {
       return false;     
    }
    return true;
}

function validateDate(strDate)
{
    var d = new Date(strDate);
    if (d == 'Invalid Date') {
       return false;     
    }
    return true;
}

function checkAllocItem(itemId)
{
    var filters = [];
    filters.push( new Array('internalid', 'is', itemId) );
    var searchResult = nlapiSearchRecord('item', null, filters, null);
    if (searchResult)
    {
        var element = searchResult[0];
        var rec_type = element.getRecordType();
        nlapiSubmitField(rec_type, itemId, 'custitem_item_alloc_check', 'T');
    }
}

function getSameAllocation(allocDetails, itemId, department, customerId, fromDate, toDate)
{
    var retObj = new Object;
    retObj.allocId = 0;
    retObj.rangeId = 0;
    
    for (var i = 0; i < allocDetails.length; i ++)
    {
        var element = allocDetails[i];
        var allocId = element.allocId;
        var rangeId =element.rangeId;
        var tmpItemId = element.itemId;
        var tmpDepartment = element.departmentName;
        var tmpCustomer = element.customerName;
        var tmpCustomerId = element.customerId;
        var tmpFromDate = element.fromDate;
        var tmpToDate = element.toDate;
        
        if (customerId) {
            if (tmpItemId == itemId && tmpCustomerId == customerId)
            {
                retObj.allocId = allocId;
                if (new Date(tmpFromDate).getTime() == new Date(fromDate).getTime() && new Date(tmpToDate).getTime() == new Date(toDate).getTime()) {
                    retObj.rangeId = rangeId;
                    break;
                }
            }    
        } else {
            if (department) {
                if (tmpItemId == itemId && tmpDepartment == department)
                {
                    retObj.allocId = allocId;
                    if (new Date(tmpFromDate).getTime() == new Date(fromDate).getTime() && new Date(tmpToDate).getTime() == new Date(toDate).getTime()) {
                        retObj.rangeId = rangeId;
                        break;
                    }
                }   
            }
        }
    }

    return retObj;
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
        var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
        var resultSet; // temporary variable used to store the result set

        var allCount = 0;
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
                itemObj.orderQty = 0;

                allocItemList.push(itemObj);
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

    return allocItemList;
}

function getDepartmentId(departmentName)
{
    var filters = [];
    filters.push(new Array('name', 'is', departmentName));
    var results = nlapiSearchRecord('department', null, filters, null);
    if (results && results.length > 0) {
        var element = results[0];
        return element.getId();
    }

    return null;
}

function getCustomerId(customerName)
{
    var filters = [];
    filters.push(new Array('companyname', 'is', customerName));
    var results = nlapiSearchRecord('customer', null, filters, null);
    if (results && results.length > 0) {
        var element = results[0];
        return element.getId();
    }

    return null;
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

/*============================================ Log =========================================*/
function dLog(title, details)
{
    nlapiLogExecution('Debug', title, details);
}

function checkGovernance()
{
 var context = nlapiGetContext();
 if( context.getRemainingUsage() < 300 )
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