function scheduled( type )
{ 
    var customerAllocList = getAllocDetailsAll();
    sendEmail(customerAllocList); 
}
    
function sendEmail(customerAllocList)
{   
    var count = 1;
    var fileId = 0;
    var contents = '';
    contents += "No" + ",";
    contents += "SKU" + ",";
    contents += "DisplayName" + ",";
    contents += "Department" + ",";
    contents += "Customer" + ",";
    contents += "AllocatedQty" + ",";
    contents += "FromDate" + ",";
    contents += "ToDate" + "\n";
    for (var i = 0; i < customerAllocList.length; i ++)
    {
        var itemAllocList = customerAllocList[i].detailArr;
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
            var soAllocatedQty = element.soAllocatedQty * 1;
            var beccaOrderQty = element.beccaOrderQty * 1;
            if (departmentId == 78 && beccaOrderQty > 0) {soAllocatedQty = beccaOrderQty;}
            var fromDate = element.fromDate;
            var toDate = element.toDate;
            
            dispName = dispName.replace(/,/gi, ".");
            customerName = customerName.replace(/,/gi, ".");
            departmentName = departmentName.replace(/,/gi, ".");

            contents += "" + count + ",";
            contents += "" + itemName + ",";
            contents += "" + dispName + ",";
            contents += "" + departmentName + ",";
            contents += "" + customerName + ",";
            contents += "" + soAllocatedQty + ",";
            contents += "" + fromDate + ",";
            contents += "" + toDate + "\n";

            count ++;
        }
    }    
    
    dLog('contents', contents);
    if (contents) {
       var file = nlapiCreateFile('so_allocated_qty_result.csv', 'CSV', contents);
       file.setFolder('-15');
       var fileId = nlapiSubmitFile(file);
       var senderID = nlapiGetUser();
       nlapiSendEmail(senderID, 'codemanstar3@outlook.com', 'Daily Sales Order Item Allocated QTY Report', 'Please check CSV file.', null, null, null, file);
       nlapiSendEmail(senderID, 'kjzapps@gmail.com', 'Daily Sales Order Item Allocated QTY Report', 'Please check CSV file.', null, null, null, file);
       dLog('contents1', fileId);
    } 
}

function getAllocDetailsAll()
{
    var allocItemList = [];
    var results = nlapiSearchRecord( 'customrecord_item_alloc', 'customsearch_item_alloc_search', null, null);
  
    if (results && results.length > 0)
    {   
        var cols = results[0].getAllColumns();
        for (var i = 0; i < results.length; i ++) 
        {   
            var element = results[i];
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
            itemObj.soAllocatedQty = 0;

            allocItemList.push(itemObj);
        }
    }

    var totalOrderObj = getItemTotalOrderAll();
    var depOrderObj = totalOrderObj.depOrderObj;
    var cusOrderObj = totalOrderObj.cusOrderObj;

    for (var i = 0; i < allocItemList.length; i ++)
    {   
        var itemId = allocItemList[i].itemId;
        var departmentId = allocItemList[i].departmentId;
        var customerId = allocItemList[i].customerId;
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
                var soAllocatedQty = detailObj['soAllocatedQty'];

                var tmpArr = shipWindow.split(" ~ ");
                var tmpFromDate = tmpArr[0].split(' ')[1];
                var tmpToDate = tmpArr[1].split(' ')[0];
                
                if (fromDate == tmpFromDate && toDate == tmpToDate)
                {
                    allocItemList[i].soAllocatedQty = soAllocatedQty;
                    break;
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
    var results = nlapiSearchRecord( 'transaction', 'customsearch572', null, null);
  
    if (results && results.length > 0)
    {   
        var depDetailArr = [];
        var oldDepartmentId = 0;
        var cusDetailArr = [];
        var oldCustomerId = 0;
        var oldItemId = 0;
        var cols = results[0].getAllColumns();
        for (var i = 0; i < results.length; i ++) 
        {   
            var element = results[i];
            var itemId = element.getValue(cols[0]);
            var IsDepAllocated = element.getValue(cols[1]);
            var customerId = element.getValue(cols[2]);
            var departmentId = element.getValue(cols[3]);
            var shipWindow = element.getValue(cols[4]);
            var soAllocatedQty = element.getValue(cols[5]);

            if (IsDepAllocated == 'T') {
                var detailObj = new Object;
                detailObj.shipWindow = shipWindow;
                detailObj.soAllocatedQty = soAllocatedQty;

                if (oldDepartmentId != departmentId)
                {
                    depDetailArr = [];
                }

                if (oldItemId != itemId) {
                    depOrderObj = {};
                }

                depDetailArr.push(detailObj);
                depOrderObj[departmentId] = depDetailArr;
                depOrderTotalObj[itemId] = depOrderObj;
                
                oldDepartmentId = departmentId;
                oldItemId = itemId;                
            } else {
                var detailObj = new Object;
                detailObj.shipWindow = shipWindow;
                detailObj.soAllocatedQty = soAllocatedQty;

                if (oldCustomerId != customerId)
                {
                    cusDetailArr = [];
                }
                if (oldItemId != itemId) {
                    cusOrderObj = {};
                }

                cusDetailArr.push(detailObj);
                cusOrderObj[customerId] = cusDetailArr;
                cusOrderTotalObj[itemId] = cusOrderObj;

                oldCustomerId = customerId;
                oldItemId = itemId;
            }
        }
    }

    totalOrderObj.depOrderObj = depOrderTotalObj;
    totalOrderObj.cusOrderObj = cusOrderTotalObj;
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

/*============================================ Log =========================================*/
function dLog(title, details)
{
    nlapiLogExecution('Debug', title, details);
}