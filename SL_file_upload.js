function uploadAssistant(request, response)
{
    var assistant = nlapiCreateAssistant("Item Allocation CSV File Upload", true);
    assistant.setOrdered( true );
    assistant.addStep('fileupload', 'Upload File on the File Cabinet').setHelpText("Please select the file that you want to upload on the File Cabinet");
    assistant.addStep('finishupload', 'File Uploaded').setHelpText("The file has now been uploaded");
    if (request.getMethod() == 'GET')
    {
        if ( !assistant.isFinished() )
        {
            // If initial step, set the Splash page and set the intial step
            if ( assistant.getCurrentStep() == null )
            {
                assistant.setCurrentStep(assistant.getStep( "fileupload") );
                assistant.setSplash("Welcome to the File Upload Setup Assistant!", "<b>This sample assistant will allow you to attach a File to a Customer record.");
            }
           
            var step = assistant.getCurrentStep();

            if (step.getName() == "fileupload")
            {
                
                var fileField = assistant.addField('file', 'file', 'Select File');
                fileField.setMandatory(true)

            }  
        }
        response.writePage(assistant);
    }
    else
    {
        assistant.setError( null );
        /* 1. if they clicked the finish button, mark setup as done and redirect to assistant page */
        if (assistant.getLastAction() == "finish")
        {
            assistant.setFinished( "You have completed the File Upload Assistant." );
            assistant.sendRedirect( response );
        }
        else if (assistant.getLastAction() == "cancel")
        {
            nlapiSetRedirectURL('tasklink', "CARD_-10");
        }
        else
        {
            if (assistant.getLastStep().getName() == "fileupload")
            {
                if (assistant.getLastAction() == "next")
                {
                    var file = request.getFile("file")
                
                    var file_type = file.getType();
                    if (file_type != 'CSV') {
                      var errMsg = "<div style='font-size: 12pt; font-weight: bold; margin-top: 13px'>File that you have uploaded is not CSV format.</div>";
                        errMsg += "<BR>";
                        errMsg += "<div style='margin-left: 51px'>" + file.getName() + "</div>";
                        errMsg += "<BR>";
                        errMsg += "<div style='margin-left: 51px'>You can only upload CSV file format. Please upload CSV file.</div>";
                      
                        assistant.setError( errMsg );
                        assistant.sendRedirect( response );
                        return;
                    }
                      
                    var folder_id = 11806;
                    file.setFolder(folder_id)
                    
                    var line_limit = 30;
                    var file_id = nlapiSubmitFile(file);
                    var upload_file_name = file.getName();
                    var saveList = parseCSV(file_id);
                    if (saveList.length > line_limit) {
                        var json_data = JSON.stringify(saveList);
                        var multiline_file = nlapiCreateFile('item_allocation_upload_data.txt', 'PLAINTEXT', json_data);
                        multiline_file.setFolder('-15');
                        var fileId = nlapiSubmitFile(multiline_file);
                        var html = 'Too much lines, we will send upload result to your email.';
                        response.write(html);
                        nlapiScheduleScript('customscript_sd_item_allocation_upload', 'customdeploy1', {'custscript_upload_file_name': upload_file_name});
                    } else {
                        var strEntireStatus = createAllocation(saveList);
                        var html = strEntireStatus;
                        html += '<script>';
                        html += 'function goReport(){';
                        html += 'window.location.href = "https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1";';
                        html += '}';
                        html += '</script>';
                        response.write(html);
                    }
                }
            }
        }
    }
}

function parseCSV(fileId)
{
    var file = nlapiLoadFile(fileId);
    var contents = file.getValue();

    var delimiter = ",";
    var pattern = new RegExp(("(\\" + delimiter + "|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\" + delimiter + "\\r\\n]*))"), "gi");

    var columnHeadings = [];
    var columnRow = true;
    //Counter for which column the script is on
    var i=0;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    var saveList = [];
    var allocObj = new Object;
    while (arrMatches = pattern.exec( contents )){
        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[ 1 ];
        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (strMatchedDelimiter.length && (strMatchedDelimiter != delimiter)){
            //Reset the column count
            i=0;
            //Next line so it isn't the first row of column headings
            columnRow=false;
            allocObj = {};
        }

        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[ 2 ]){
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[ 2 ].replace(new RegExp( "\"\"", "g" ), "\"");
        } else {
            var strMatchedValue = arrMatches[ 3 ];

        }

        if(columnRow == true) {
            columnHeadings.push( strMatchedValue );
        } else {
            if (i == 0) {
                allocObj['itemId'] = strMatchedValue;     
            }else if (i == 1) {
                allocObj['itemName'] = strMatchedValue;     
            }else if (i == 2) {
                allocObj['invAllocTotal'] = strMatchedValue.replace(/,/gi, "") * 1;     
            }else if (i == 3) {
                allocObj['department'] = strMatchedValue;     
            }else if (i == 4) {
                allocObj['customer'] = strMatchedValue;     
            }else if (i == 5) {
                allocObj['allocQty'] = strMatchedValue.replace(/,/gi, "") * 1;
            }else if (i == 6) {
                allocObj['fromDate'] = strMatchedValue;     
            }else if (i == 7) {
                allocObj['toDate'] = strMatchedValue;     

                saveList.push(allocObj);
            }
        }
        i++;
    }

    return saveList;
}

function createAllocation(saveList)
{
    var allocDetails = getAllocDetailsAll();
    
    var strEntireStatus = '';
    var successCount = 0;
    var failedCount = 0;
    
    for (var i = 0; i < saveList.length; i ++)
    {
        var lineNumber = i + 1;
        var element = saveList[i];
        var strErrMsg = validateEntry(element);
        if (strErrMsg) {
            strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + strErrMsg + '<BR>';
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
            strEntireStatus += 'Failed Line # : ' + lineNumber + ' => Invalid Department or Customer.<BR>';
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
                        strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + error.getDetails() + '<BR>';
                        failedCount ++;
                        continue;
                        nlapiLogExecution( "error", "Process Error", error.getCode() + ":" + error.getDetails() );
                    } else {
                        strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + error.toString() + '<BR>';
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
                    strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + error.getDetails() + '<BR>';
                    failedCount ++;
                    continue;
                    nlapiLogExecution( "error", "Process Error", error.getCode() + ":" + error.getDetails() );
                } else {
                    strEntireStatus += 'Failed Line # : ' + lineNumber + ' => ' + error.toString() + '<BR>';
                    failedCount ++;
                    continue;
                    nlapiLogExecution( "error", "Unexpected Error", error.toString() );
                }
            }
        }
        if (allocId && invAllocTotal) {
            nlapiSubmitField('customrecord_item_alloc', allocId, ['custrecord_item_alloc_total'], [invAllocTotal] );    
        }
        strEntireStatus += 'Success Line # : ' + lineNumber + '<BR>';
        successCount ++;
    } 

    strEntireStatus += '<BR>';
    strEntireStatus += '<BR>';
    strEntireStatus += 'Success : ' + successCount;
    strEntireStatus += '<BR>';
    strEntireStatus += 'Failed : ' + failedCount;

    if (successCount > 0 && failedCount == 0) {
        strEntireStatus = '<div><button onclick="goReport()">Go Back Report</button></div><BR><div style="font-size:16pt; color:green; font-weight:bold">Your file uploaded successfully</div><BR>' + strEntireStatus;
    }

    if (failedCount > 0) {
        strEntireStatus = '<div><button onclick="goReport()">Go Back Report</button></div><BR><div style="font-size:16pt; color:red; font-weight:bold">Some lines from the upload failed. See below</div><BR>' + strEntireStatus;
    }

    return strEntireStatus;
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

function dLog(title, details)
{
    nlapiLogExecution('Debug', title, details);
}