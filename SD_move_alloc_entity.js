function scheduled(type)
{   
 //   moveEntity();
 //   updateAllocId();
      deleteEmptyAllocRangeRec();
}

function deleteEmptyAllocRangeRec()
{
    try {
        // resultIndex points to record starting current resultSet in the entire results array
        var search = nlapiLoadSearch( 'customrecord_item_alloc', 'customsearch_item_alloc_search_6' );
        var searchResults = search.runSearch();
        var cols = search.getColumns();
        // resultIndex points to record starting current resultSet in the entire results array
        var resultIndex = 0;
        var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
        var resultSet; // temporary variable used to store the result set

        var allCount = 0;
        var deleteCount = 0;
        do
        {
            resultSet = searchResults.getResults(resultIndex, resultIndex + resultStep);
            for (var i = 0; i < resultSet.length; i ++) 
            {  
                if( (i % 5) == 0 ) {
                  setRecoveryPoint();
                }
                checkGovernance();
                var element = resultSet[i];
                var rangeId = element.getValue(cols[0]) * 1;
                var allocId = element.getValue(cols[1]) * 1;
              
                if (!rangeId) {
                    deleteCount ++;
                    nlapiDeleteRecord('customrecord_item_alloc', allocId);
                    dLog(allCount, allocId);    
                }
                
                allCount ++;
            }
            resultIndex = resultIndex + resultStep;
     
        } while (resultSet.length > 0);

        dLog('deleteCount', deleteCount);
    } catch ( error ) {
        if ( error.getDetails != undefined ) {
          nlapiLogExecution( "error", "Process Error1", error.getCode() + ":" + error.getDetails() );
        } else {
          nlapiLogExecution( "error", "Unexpected Error", error.toString() );
        }
    }   
}

function updateAllocId()
{
    try {
        var allocIdListObj = getUniqueAllocIdList();

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
                if( (i % 5) == 0 ) {
                  setRecoveryPoint();
                }
                checkGovernance();
                var element = resultSet[i];
                var allocId = element.getId();
                var customerId = element.getValue(cols[0]);
                var customerName = element.getText(cols[0]);
                var itemId = element.getValue(cols[1]);
                var itemName = element.getText(cols[1]);
                var locationId = element.getValue(cols[2]);
                var locationName = element.getText(cols[2]);
                var allocQty = element.getValue(cols[3]);
                var fromDate = element.getValue(cols[4]);
                var toDate = element.getValue(cols[5]);
                var rangeId = element.getValue(cols[6]);
                var recInvtotal = element.getValue(cols[7]);
                var dispName = element.getValue(cols[8]);
                var departmentId = element.getValue(cols[9]);
                var departmentName = element.getText(cols[9]);

                var itemObj = allocIdListObj[itemId];
                if (itemObj != undefined && itemObj != 'undefined') {
                    var mainAllocId = itemObj['allocId'];
                    var invAllocTotal = itemObj['invAllocTotal'];
                    var sttDate = itemObj['sttDate'];
                    var invAllocTotal1 = itemObj['invAllocTotal1'];
                    var sttDate1 = itemObj['sttDate1'];
                                
                    if (rangeId * 1 > 0) {
                        var swRec = nlapiLoadRecord('customrecord_item_alloc_date_range', rangeId);
                        swRec.setFieldValue('custrecord_item_alloc_date_range_entity', mainAllocId);
                        nlapiSubmitRecord(swRec);
                        
                        var allocRec = nlapiLoadRecord('customrecord_item_alloc', mainAllocId);
                        allocRec.setFieldValue('custrecord_item_alloc_stt_date', sttDate);
                        allocRec.setFieldValue('custrecord_item_alloc_stt_date_1', sttDate1);
                        allocRec.setFieldValue('custrecord_item_alloc_total', invAllocTotal);
                        allocRec.setFieldValue('custrecord_item_alloc_total_1', invAllocTotal1);
                        nlapiSubmitRecord(allocRec);
                      
                        var logMsg = '' + rangeId + ' - ' + itemName + ' - ' + mainAllocId + ' - ' + sttDate + ' - ' + invAllocTotal + ' - ' + sttDate1 + ' - ' + invAllocTotal1;
                        dLog(allCount, logMsg);    
                    } else {
                        dLog(allCount + ' - ' + itemName + ' - ' + departmentName + ' : ' + customerName, 'Range ID Nothing');    
                    }
                    
                } else {
                    dLog(allCount + ' - ' + itemName + ' - ' + departmentName + ' : ' + customerName, 'failed');
                }
                
                allCount ++;
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
}

function getUniqueAllocIdList() 
{
    var obj = new Object;
    try {
        // resultIndex points to record starting current resultSet in the entire results array
        var search = nlapiLoadSearch( 'customrecord_item_alloc', 'customsearch_item_alloc_search_5' );
        var searchResults = search.runSearch();
        var cols = search.getColumns();
        // resultIndex points to record starting current resultSet in the entire results array
        var resultIndex = 0;
        var resultStep = 1000; // Number of records returned in one step (maximum is 1000)
        var resultSet; // temporary variable used to store the result set

        do
        {
            resultSet = searchResults.getResults(resultIndex, resultIndex + resultStep);
            for (var i = 0; i < resultSet.length; i ++) 
            {  
                var element = resultSet[i];
                var itemId = element.getValue(cols[0]);
                var invAllocTotal = element.getValue(cols[1]);
                var sttDate = element.getValue(cols[2]);
                var invAllocTotal1 = element.getValue(cols[3]);
                var sttDate1 = element.getValue(cols[4]);
                var allocId = element.getValue(cols[5]);

                var itemObj = new Object;
                itemObj['allocId'] = allocId;
                itemObj['invAllocTotal'] = invAllocTotal;
                itemObj['sttDate'] = sttDate;
                itemObj['invAllocTotal1'] = invAllocTotal1;
                itemObj['sttDate1'] = sttDate1;
                obj[itemId] = itemObj;
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

    return obj;
}

function moveEntity()
{
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
                if( (i % 5) == 0 ) {
                  setRecoveryPoint();
                }
                checkGovernance();
                var element = resultSet[i];
                var allocId = element.getId();
                var customerId = element.getValue(cols[0]);
                var customerName = element.getText(cols[0]);
                var itemId = element.getValue(cols[1]);
                var itemName = element.getText(cols[1]);
                var locationId = element.getValue(cols[2]);
                var locationName = element.getText(cols[2]);
                var allocQty = element.getValue(cols[3]);
                var fromDate = element.getValue(cols[4]);
                var toDate = element.getValue(cols[5]);
                var rangeId = element.getValue(cols[6]);
                var recInvtotal = element.getValue(cols[7]);
                var dispName = element.getValue(cols[8]);
                var departmentId = element.getValue(cols[9]);
                var departmentName = element.getText(cols[9]);

                var swRec = nlapiLoadRecord('customrecord_item_alloc_date_range', rangeId);
                swRec.setFieldValue('custrecord_alloc_department', departmentId);
                swRec.setFieldValue('custrecord_alloc_customer', customerId);
                nlapiSubmitRecord(swRec);
                allCount ++;

                dLog(allCount, itemName);
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