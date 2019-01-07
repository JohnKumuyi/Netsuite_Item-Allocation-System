function main(request, response)
{   
     if ( request.getMethod() == 'GET' )
     {  
        var itemId = request.getParameter('itemId');
        var submit_type = request.getParameter('submit_type');
        var display_mode = request.getParameter('display_mode');
        if (itemId) {
            if (submit_type == 'NewCustomer')
            {
                var form = makePageForPost(itemId, 'normal');
                response.writePage(form);
            }
            else if (submit_type == 'DelCustomer')
            {
                deleteEmptyRecord(itemId);
                var form = makePageForPost(itemId, 'normal');
                response.writePage(form);   
            }
            else if (submit_type == 'Edit')
            {
                var form = makePageForPost(itemId, 'normal');
                response.writePage(form);   
            }
            else{
                if (display_mode)
                {
                    deleteEmptyRecord(itemId);
                    var form = makePageForPost(itemId, display_mode);
                    response.writePage(form); 
                }
            }
        }else{
            var form = makePageForGet('normal');
            response.writePage(form);
        }
    }
    else
    {
        var submit_type = request.getParameter('submit_type');
        var itemId = request.getParameter('itemId');
         
        if (submit_type == 'ItemSaved')
        {
            var itemId = request.getParameter('alloc_item');
          
            saveData(request);    

            var form = makePageForPost(itemId, 'normal');
            response.writePage(form);
        }
        else if (submit_type == 'NewCustomer')
        {
            newShipWindow(itemId);
            response.write('1');
        }
        else if (submit_type == 'DelCustomer')
        {
            var retErrorMsg = deleteData(request);

            if (retErrorMsg)
            {   
                response.write(retErrorMsg);
            }
            else
            {
                response.write('1');    
            }            
        }
    }
}

function saveData(req)
{   
    var itemId = request.getParameter('alloc_item');
    var sttDate = request.getParameter('stt_date');
    var invAllocTotal = request.getParameter('inv_alloc_total');
    var sttDate1 = request.getParameter('stt_date_1');
    var invAllocTotal1 = request.getParameter('inv_alloc_total_1');
    var allCount = request.getParameter('total_count');

    sttDate = '' + sttDate;
    dLog('sttDate', sttDate);

    var allocList = [];
    for (var i = 0; i < allCount; i ++)
    {
        var index = i + 1;
        var allocId = request.getParameter('alloc_rec_' + index) * 1;
        var rangeId = request.getParameter('range_rec_' + index) * 1;
        var departmentId = request.getParameter('department_' + index) * 1;
        var customerId = request.getParameter('customer_' + index) * 1;
        var allocQty = request.getParameter('allocated_total_' + index);
        var orderQty = request.getParameter('total_order_' + index);
        var fromDate = request.getParameter('from_date_' + index);
        var toDate = request.getParameter('to_date_' + index);
        if (!departmentId) {departmentId = null;}
        if (!customerId) {customerId = null;}
        if (!sttDate) {sttDate = null;}
        if (departmentId != 78) { orderQty = 0;}

        if (rangeId) {
            dLog('departmentId', departmentId);
            dLog('customerId', customerId);
            dLog('allocId', allocId);
            nlapiSubmitField('customrecord_item_alloc', allocId, ['custrecord_item_alloc_total', 'custrecord_item_alloc_stt_date', 'custrecord_item_alloc_total_1', 'custrecord_item_alloc_stt_date_1'], [invAllocTotal, sttDate, invAllocTotal1, sttDate1] );        
            nlapiSubmitField('customrecord_item_alloc_date_range', rangeId, ['custrecord_alloc_department', 'custrecord_alloc_customer', 'custrecord_item_alloc_qnty', 'custrecord_item_alloc_date_range_from', 'custrecord_item_alloc_date_range_to', 'custrecord_total_ordered_becca_com'], [departmentId, customerId, allocQty, fromDate, toDate, orderQty] );
            dLog('completed', '' + departmentId + ' : ' + customerId);
        } else {
            var sameAllocId = getSameAllocId(allocList, departmentId, customerId, itemId); 
            if (sameAllocId) {
                nlapiDeleteRecord('customrecord_item_alloc', allocId);
                allocId = sameAllocId;
            } else {
                nlapiSubmitField('customrecord_item_alloc', allocId, ['custrecord_item_alloc_total', 'custrecord_item_alloc_stt_date', 'custrecord_item_alloc_total_1', 'custrecord_item_alloc_stt_date_1'], [invAllocTotal, sttDate, invAllocTotal1, sttDate1] );    
            }
            var rangeRec = nlapiCreateRecord('customrecord_item_alloc_date_range');
            rangeRec.setFieldValue('custrecord_alloc_department', departmentId);
            rangeRec.setFieldValue('custrecord_alloc_customer', customerId);
            rangeRec.setFieldValue('custrecord_item_alloc_date_range_entity', allocId);
            rangeRec.setFieldValue('custrecord_item_alloc_qnty', allocQty);
            rangeRec.setFieldValue('custrecord_item_alloc_date_range_from', fromDate);
            rangeRec.setFieldValue('custrecord_item_alloc_date_range_to', toDate);
            rangeRec.setFieldValue('custrecord_total_ordered_becca_com', orderQty);
            nlapiSubmitRecord(rangeRec, false, true);
        }

        var allocObj = new Object;
        allocObj.allocId = allocId;
        allocObj.departmentId = departmentId;
        allocObj.customerId = customerId;
        allocObj.itemId = itemId;
        allocList.push(allocObj);
    }
}

function getSameAllocId(allocList, departmentId, customerId, itemId)
{
    for (var i = 0; i < allocList.length; i ++)
    {
        var tmpDepartmentId = allocList[i].departmentId;
        var tmpCustomerId = allocList[i].customerId;
        var tmpItemId = allocList[i].itemId;
        var tmpAllocId = allocList[i].allocId;
        if (departmentId) {
            if (departmentId == tmpDepartmentId && itemId == tmpItemId)
            {
                return tmpAllocId;
            }
        }
        if (customerId) {
            if (customerId == tmpCustomerId && itemId == tmpItemId)
            {
                return tmpAllocId;
            }
        }
    }

    return 0;
}

function deleteData(req)
{   
    var retMsg = '' ;
    var retMsg_suffix = ' is linked to the shipwindow entry and cannot be deleted. Please delete sales order before deleting this row.';

    var itemId = request.getParameter('itemId');
    var allCount = request.getParameter('total_count');

    var allocList = [];
    for (var i = 0; i < allCount; i ++)
    {
        var index = i + 1;
        var delCheck = request.getParameter('del_check_' + index);
        if (delCheck == 'T')
        {
            var allocObj = new Object;
            allocObj.allocId = request.getParameter('alloc_rec_' + index) * 1;
            allocObj.rangeId = request.getParameter('range_rec_' + index) * 1;
            allocObj.customerId = request.getParameter('customer_' + index) * 1;
            allocObj.allocQty = request.getParameter('allocated_total_' + index);
            allocObj.fromDate = request.getParameter('from_date_' + index);
            allocObj.toDate = request.getParameter('to_date_' + index);

            allocList.push(allocObj);
        }
    }

    if (allocList.length > 0)
    {
        var soListObj = getUsedSaleOrders(allocList);
        
        for (var i = 0; i < allocList.length; i ++)
        {   
            var element = allocList[i];
            var allocId = element.allocId * 1;
            var rangeId = element.rangeId * 1;
            var tranIdArr = soListObj[rangeId];
            if (tranIdArr != undefined && tranIdArr != 'undefined' && tranIdArr.length > 0)
            {
                retMsg += 'Sales Order # ';
                for (var k = 0; k < tranIdArr.length; k ++)
                {
                    var tranId = tranIdArr[k];
                    retMsg += tranId + ', ';
                }
                retMsg = retMsg.substr(0, retMsg.length - 2);
                retMsg += retMsg_suffix;
            }
            else  // Delete ShipWindow
            {
                if (rangeId) {
                    nlapiDeleteRecord('customrecord_item_alloc_date_range', rangeId);
                    if (getAllocDateRangeCount(allocId) == 0){
                        nlapiDeleteRecord('customrecord_item_alloc', allocId);    
                    }
                } else {
                    nlapiDeleteRecord('customrecord_item_alloc', allocId);
                }
            }
        }
    }
  
    return retMsg;
}

function getAllocDateRangeCount(allocId)
{
    var count = 0;
    var filters = [];
    filters.push(new nlobjSearchFilter('custrecord_item_alloc_date_range_entity', null, 'anyof', allocId));
    var results = nlapiSearchRecord( 'customrecord_item_alloc_date_range', null, filters, null);
  
    if (results && results.length > 0)
    {   
         count = results.length;
    }   
    return count;
}

function getUsedSaleOrders(allocList)
{
    var filters = [];
    var sub_filters = [];
    for (var i = 0; i < allocList.length; i ++ ){
         sub_filters.push( new Array( 'custcol_shipwindowid', 'is', '' + allocList[i].rangeId ) );
         sub_filters.push("OR");
    }
    sub_filters.pop();
    filters.push(sub_filters);
    filters.push("AND");
    filters.push( new Array( 'recordtype', 'is', 'salesorder' ) );
 
    var cols = [];
    cols.push( new nlobjSearchColumn('custcol_shipwindowid', null, 'group'));
    cols.push( new nlobjSearchColumn('tranid', null, 'group'));
    
    var oldShipId = 0;
    var soListObj = new Object;
    var tranIdArr = [];
    var searchresults = nlapiSearchRecord( 'transaction', null, filters, cols );

    if ( searchresults != null && searchresults.length > 0 ) 
    {
        for (var i = 0; i < searchresults.length; i ++)
        {
            var element = searchresults[i];
            var shipId = element.getValue(cols[0]);
            var tranId = element.getValue(cols[1]);

            if (shipId != oldShipId) {
                tranIdArr = [];
            }
            tranIdArr.push(tranId);
            soListObj[shipId] = tranIdArr;

            oldShipId = shipId;
        }
    }

    return soListObj;
}

function newShipWindow(itemId)
{
    var allocRec = nlapiCreateRecord('customrecord_item_alloc');
    allocRec.setFieldValue('custrecord_item_alloc_sku', itemId);
    var allocId = nlapiSubmitRecord(allocRec, false, true);
}

function deleteEmptyRecord(itemId)
{
    var filters = [];
    filters.push(new nlobjSearchFilter('custrecord_item_alloc_sku', null, 'anyof', itemId));
    var results = nlapiSearchRecord( 'customrecord_item_alloc', 'customsearch_item_alloc_search', filters, null);
  
    if (results && results.length > 0)
    {   
        var cols = results[0].getAllColumns();
        for (var i = 0; i < results.length; i ++) 
        {   
            var element = results[i];
            var allocId = element.getId() * 1;
            var rangeId = element.getValue(cols[6]) * 1;

            if (!rangeId)
            {
                nlapiDeleteRecord('customrecord_item_alloc', allocId);
            }
        }
    }
}

function makePageForGet(displayMode)
{
    var form = nlapiCreateForm('Item Allocation Report');
    
    var refreshScript = "refreshAll()";
    var addNewScript = "addNewCustomer()";
    var expandScript = "expandAndCollapseAll()";
    var deleteScript = "deleteCustomer()";
    var editScript = "editPage()";
    var excelExportScript = "excelExport()";
    var excelExportAllScript = "excelExportAll()";
    var excelImportScript = "excelImport()";
    
    var context = nlapiGetContext();
    var userEmail = context.getEmail();
    dLog('userEmail', userEmail);
    if (userEmail == 'kjzapps@gmail.com' || userEmail == 'Lwiener@beccacosmetics.com') {
        if (displayMode == 'inline') {
            form.addButton('edit', 'Edit', editScript);
        }else{
            form.addSubmitButton('Save');    
            form.addButton('delete_customer', 'Delete', deleteScript);
            form.addButton('reset_customer', 'Refresh', refreshScript);
            form.addButton('add_new_customer', 'Add New Customer', addNewScript);
        }
    }

    form.addButton('excel_export', 'Export Item', excelExportScript);
    form.addButton('excel_export_all', 'Export All Items', excelExportAllScript);
    form.addButton('excel_import', 'Import CSV', excelImportScript);
    form.addButton('collapse_expand_all', 'Expand All / Collapse All', expandScript);
    form.setScript('customscript_cs_itemalloc_report');
    
    var main_group = form.addFieldGroup( 'main_group', 'Allocation Header');
    
    /*============ PARAM ===========*/
    var submit_type = form.addField('submit_type','text', 'SUBMIT TYPE', null, 'main_group');
    submit_type.setDisplayType('hidden');

    var first_customer = form.addField('first_customer','text', 'FIRST CUSTOMER', null, 'main_group');
    first_customer.setDisplayType('hidden');

    var total_count = form.addField('total_count','text', 'TOTAL COUNT', null, 'main_group');
    total_count.setDisplayType('hidden');

    var na_count = form.addField('na_count','text', 'NORTH AMERICA COUNT', null, 'main_group');
    na_count.setDisplayType('hidden');

    var intl_count = form.addField('intl_count','text', 'INTERNATIONAL COUNT', null, 'main_group');
    intl_count.setDisplayType('hidden');

    var display_mode = form.addField('display_mode','text', 'Display Mode', null, 'main_group');
    display_mode.setDisplayType('hidden');
    display_mode.setDefaultValue(displayMode);
    
    /*=============Main Data=================*/

    var item = form.addField('alloc_item', 'select', 'ITEM', 'item', 'main_group');
    item.setLayoutType('normal','startcol')
 //   item.setDisplayType('hidden');
    
    var htmlItemPanel = "<div>";
    htmlItemPanel += '<div style="font-size: 10pt; margin-top:  10px; margin-left:  5px; color: #737171;">ITEM</div><div style="display: inline-flex; margin-right: 50px;"><div style="display:inline-block"><input type="text" name="alloc_item_txt" id="alloc_item_txt" value="<Type then tab>" style="font-size: 10pt; width: 300px;height: 26px;margin-left: 5px;margin-right: 5px;font-size: 12pt;text-align: left;margin-top: 2px;text-indent: 3px;" class="ui-autocomplete-input" autocomplete="off"></div><div style="display: inline-block; margin-left: -28px; background-color:white; z-index:1000; cursor: pointer; height: 24px; margin-top: 3px"><img src="/uirefresh/img/field/dropdown.png" style="width: 22px;height: 22px;margin-top: 0px;" id="inpt_item_arrow" arrow_clicked="F"></div><div id="item_link_wrapper" style="display: inline-block; padding-top:2px; margin-left:3px"><span class="uir-field-widget"><a data-helperbuttontype="open" href="#" id="item_popup_link" class="smalltextul field_widget i_dropdownlink i_options" tabindex="-1" title="Open"></a></span></div></div>';
    htmlItemPanel += "</div>";
    var itemPanel = form.addField('alloc_item_panel', 'inlinehtml', 'Item Panel', null, 'main_group');
    itemPanel.setLayoutType('normal','startcol')
    itemPanel.setDefaultValue( htmlItemPanel );
    
    var sttDate = form.addField('stt_date', 'date', 'STT DATE', null, 'main_group');
    sttDate.setBreakType('startcol');
    sttDate.setDisplaySize(10, 22);
    if (displayMode) {
        sttDate.setDisplayType(displayMode);
    }
    
    var sttDate1 = form.addField('stt_date_1', 'date', 'STT DATE', null, 'main_group');
    sttDate1.setBreakType('startrow');
    sttDate1.setDisplaySize(10, 22);
    if (displayMode) {
        sttDate1.setDisplayType(displayMode);
    }

    var invAllocTotal = form.addField('inv_alloc_total', 'integer', 'INVENTORY ALLOCATION TOTAL', null, 'main_group');
    invAllocTotal.setBreakType('startcol');
    invAllocTotal.setDisplaySize(20, 22);
    if (displayMode) {
        invAllocTotal.setDisplayType(displayMode);
    }

    var version_us = form.addField('version_us', 'text', '', null, 'main_group');
    version_us.setDisplaySize(20, 22);
    version_us.setDisplayType('inline');
    version_us.setDefaultValue('Total US');
    var version_intl = form.addField('version_intl', 'text', '', null, 'main_group');
    version_intl.setDisplaySize(20, 22);
    version_intl.setDisplayType('inline');
    version_intl.setDefaultValue('Total International');

    var invAllocTotal1 = form.addField('inv_alloc_total_1', 'integer', 'INVENTORY ALLOCATION TOTAL', null, 'main_group');
    invAllocTotal1.setDisplaySize(20, 22);
    if (displayMode) {
        invAllocTotal1.setDisplayType(displayMode);
    }

    var version_us_1 = form.addField('version_us_1', 'text', '', null, 'main_group');
    version_us_1.setDisplaySize(20, 22);
    version_us_1.setDisplayType('inline');
    version_us_1.setDefaultValue('Total US');
    var version_intl_1 = form.addField('version_intl_1', 'text', '', null, 'main_group');
    version_intl_1.setDisplaySize(20, 22);
    version_intl_1.setDisplayType('inline');
    version_intl_1.setDefaultValue('Total International');

    var totalAllocated = form.addField('total_allocated', 'integer', 'TOTAL ALLOCATED', null, 'main_group');
    totalAllocated.setBreakType('startcol');
    totalAllocated.setDisplaySize(10, 22);
    if (displayMode) {
        totalAllocated.setDisplayType('inline');
    }

    var totalAllocated_us = form.addField('total_allocated_us', 'integer', '', null, 'main_group');
    totalAllocated_us.setDisplaySize(10, 22);
    totalAllocated_us.setDisplayType('inline');
    var totalAllocated_intl = form.addField('total_allocated_intl', 'integer', '', null, 'main_group');
    totalAllocated_intl.setDisplaySize(10, 22);
    totalAllocated_intl.setDisplayType('inline');
   
    var totalAllocated1 = form.addField('total_allocated_1', 'integer', 'TOTAL ALLOCATED', null, 'main_group');
    totalAllocated1.setDisplaySize(10, 22);
    if (displayMode) {
        totalAllocated1.setDisplayType('inline');
    }
    var totalAllocated_us_1 = form.addField('total_allocated_us_1', 'integer', '', null, 'main_group');
    totalAllocated_us_1.setDisplaySize(10, 22);
    totalAllocated_us_1.setDisplayType('inline');
    var totalAllocated_intl_1 = form.addField('total_allocated_intl_1', 'integer', '', null, 'main_group');
    totalAllocated_intl_1.setDisplaySize(10, 22);
    totalAllocated_intl_1.setDisplayType('inline');
     
    var qtyAvailable = form.addField('qty_available', 'integer', 'QTY AVAILABLE', null, 'main_group');
    qtyAvailable.setBreakType('startcol');
    qtyAvailable.setDisplaySize(10, 22);
    if (displayMode) {
        qtyAvailable.setDisplayType('inline');
    }
    var qtyAvailable_us = form.addField('qty_available_us', 'integer', '', null, 'main_group');
    qtyAvailable_us.setDisplaySize(10, 22);
    qtyAvailable_us.setDisplayType('inline');
    var qtyAvailable_intl = form.addField('qty_available_intl', 'integer', '', null, 'main_group');
    qtyAvailable_intl.setDisplaySize(10, 22);
    qtyAvailable_intl.setDisplayType('inline');

    var qtyAvailable1 = form.addField('qty_available_1', 'integer', 'QTY AVAILABLE', null, 'main_group');
    qtyAvailable1.setDisplaySize(10, 22);
    if (displayMode) {
        qtyAvailable1.setDisplayType('inline');
    }
    var qtyAvailable_us_1 = form.addField('qty_available_us_1', 'integer', '', null, 'main_group');
    qtyAvailable_us_1.setDisplaySize(10, 22);
    qtyAvailable_us_1.setDisplayType('inline');
    var qtyAvailable_intl_1 = form.addField('qty_available_intl_1', 'integer', '', null, 'main_group');
    qtyAvailable_intl_1.setDisplaySize(10, 22);
    qtyAvailable_intl_1.setDisplayType('inline');
  
    var totalOrderFL = form.addField('total_order_fulfill', 'integer', 'TOTAL ORDERED', null, 'main_group');
    totalOrderFL.setBreakType('startcol');
    totalOrderFL.setDisplaySize(10, 22);
    if (displayMode) {
        totalOrderFL.setDisplayType('inline');
    }
    var totalOrder_us = form.addField('total_order_us', 'integer', '', null, 'main_group');
    totalOrder_us.setDisplaySize(10, 22);
    totalOrder_us.setDisplayType('inline');
    var totalOrder_intl = form.addField('total_order_intl', 'integer', '', null, 'main_group');
    totalOrder_intl.setDisplaySize(10, 22);
    totalOrder_intl.setDisplayType('inline');

    var totalOrderFL1 = form.addField('total_order_fulfill_1', 'integer', 'TOTAL ORDERED', null, 'main_group');
    totalOrderFL1.setDisplaySize(10, 22);
    if (displayMode) {
        totalOrderFL1.setDisplayType('inline');
    }
    var totalOrder_us_1 = form.addField('total_order_us_1', 'integer', '', null, 'main_group');
    totalOrder_us_1.setDisplaySize(10, 22);
    totalOrder_us_1.setDisplayType('inline');
    var totalOrder_intl_1 = form.addField('total_order_intl_1', 'integer', '', null, 'main_group');
    totalOrder_intl_1.setDisplaySize(10, 22);
    totalOrder_intl_1.setDisplayType('inline');
   
    var backOrderFulfill = form.addField('backorder_fulfilled', 'integer', 'Backorder fulfilled ', null, 'main_group');
    backOrderFulfill.setBreakType('startcol');
    backOrderFulfill.setDisplaySize(10, 22);
    if (displayMode) {
        backOrderFulfill.setDisplayType('inline');
    }
    backOrderFulfill.setDisplayType('hidden');
        
    var qtyRemainingAll = form.addField('qty_remaining_all', 'integer', 'REMAINING TO BE ORDERED', null, 'main_group');
    qtyRemainingAll.setBreakType('startcol');
    qtyRemainingAll.setDisplaySize(30, 22);
    if (displayMode) {
        qtyRemainingAll.setDisplayType('inline');
    }
    var qtyRemaining_us = form.addField('qty_remaining_us', 'integer', '', null, 'main_group');
    qtyRemaining_us.setDisplaySize(10, 22);
    qtyRemaining_us.setDisplayType('inline');
    var qtyRemaining_intl = form.addField('qty_remaining_intl', 'integer', '', null, 'main_group');
    qtyRemaining_intl.setDisplaySize(10, 22);
    qtyRemaining_intl.setDisplayType('inline');

    var qtyRemainingAll1 = form.addField('qty_remaining_all_1', 'integer', 'REMAINING TO BE ORDERED', null, 'main_group');
    qtyRemainingAll1.setDisplaySize(30, 22);
    if (displayMode) {
        qtyRemainingAll1.setDisplayType('inline');
    }
    var qtyRemaining_us_1 = form.addField('qty_remaining_us_1', 'integer', '', null, 'main_group');
    qtyRemaining_us_1.setDisplaySize(10, 22);
    qtyRemaining_us_1.setDisplayType('inline');
    var qtyRemaining_intl_1 = form.addField('qty_remaining_intl_1', 'integer', '', null, 'main_group');
    qtyRemaining_intl_1.setDisplaySize(10, 22);
    qtyRemaining_intl_1.setDisplayType('inline');
    
    var excel_export_html = form.addField('excel_export_html', 'inlinehtml', 'EXCEL EXPORT HTML', null, 'main_group');
    excel_export_html.setBreakType('startcol');
    
    var excel_export_all_html = form.addField('excel_export_all_html', 'inlinehtml', 'EXCEL EXPORT ALL HTML', null, 'main_group');
    excel_export_all_html.setBreakType('startcol');
  
    /*=============North America=====================*/    
    var detail_group_na = form.addFieldGroup( 'detail_group_na', 'North America');
    detail_group_na.setSingleColumn(false);
    detail_group_na.setCollapsible(false, false);
    // Parameters
    var allocRec_na = form.addField('alloc_rec_na','integer', 'ALLOCATION RECORD INDEX', null, 'detail_group_na');
    allocRec_na.setLayoutType('normal')
    allocRec_na.setDisplayType('hidden');

    var rangeRec_na = form.addField('range_rec_na','integer', 'SHIPWINDOW RECORD INDEX', null, 'detail_group_na');
    rangeRec_na.setLayoutType('normal')
    rangeRec_na.setDisplayType('hidden');

    // Detail Fields
    var department_na = form.addField('department_na','select', 'DEPARTMENT', 'department', 'detail_group_na');
    department_na.setLayoutType('normal')
    department_na.setDisplayType('hidden');

    var customer_na = form.addField('customer_na','select', 'CUSTOMER', 'customer', 'detail_group_na');
    customer_na.setLayoutType('normal')
    customer_na.setDisplayType('hidden');
      
    var allocatedTotal_na = form.addField('allocated_total_na', 'integer', 'ALLOCATED TOTAL', null, 'detail_group_na');
    allocatedTotal_na.setLayoutType('normal')
    allocatedTotal_na.setDisplaySize(10, 22);
    allocatedTotal_na.setDisplayType('hidden');
         
    var totalOrder_na = form.addField('total_order_line_na', 'integer', 'TOTAL ORDER', null, 'detail_group_na');
    totalOrder_na.setDisplaySize(10, 22);
    totalOrder_na.setDisplayType('hidden');

    var totalOrderLegacy_na = form.addField('to_legacy_na', 'integer', 'TOTAL ORDER', null, 'detail_group_na');
    totalOrderLegacy_na.setDisplaySize(10, 22);
    totalOrderLegacy_na.setDisplayType('hidden');
    
    var remainQty_na = form.addField('remain_qty_na', 'integer', 'REMAINING TO BE ORDERED', null, 'detail_group_na');
    remainQty_na.setDisplaySize(20, 22);
    remainQty_na.setDisplayType('hidden');
        
    var fromDate_na = form.addField('from_date_na', 'date', 'FROM DATE', null, 'detail_group_na');
    fromDate_na.setDisplaySize(10, 22);
    fromDate_na.setDisplayType('hidden');
        
    var toDate_na = form.addField('to_date_na', 'date', 'TO DATE', null, 'detail_group_na');
    toDate_na.setDisplaySize(10, 22);
    toDate_na.setDisplayType('hidden');

    var delCheck_na = form.addField('del_check_na','checkbox', 'DELETE', null, 'detail_group_na');
    delCheck_na.setDisplayType('hidden');

    var customerList_na = form.addField('customer_list_na', 'inlinehtml', 'CUSTOMER LIST', null, 'detail_group_na');
    customerList_na.setDisplayType('hidden');
    customerList_na.setDefaultValue( "<div style='width: 26px;height: 26px;margin-left: 0px;font-size: 12pt;border: solid 2px #f31010;text-align:  center;'>E</div>" );

    /*=============International=====================*/
    var detail_group_intl = form.addFieldGroup( 'detail_group_intl', 'International');
    detail_group_intl.setSingleColumn(false);
    detail_group_intl.setCollapsible(false, false);
    // Parameters
    var allocRec_intl = form.addField('alloc_rec_intl','integer', 'ALLOCATION RECORD INDEX', null, 'detail_group_intl');
    allocRec_intl.setLayoutType('normal')
    allocRec_intl.setDisplayType('hidden');

    var rangeRec_intl = form.addField('range_rec_intl','integer', 'SHIPWINDOW RECORD INDEX', null, 'detail_group_intl');
    rangeRec_intl.setLayoutType('normal')
    rangeRec_intl.setDisplayType('hidden');
    
    // Detail Fields
    var department_intl = form.addField('department_intl','select', 'DEPARTMENT', 'department', 'detail_group_intl');
    department_intl.setLayoutType('normal')
    department_intl.setDisplayType('hidden');

    var customer_intl = form.addField('customer_intl','select', 'CUSTOMER', 'customer', 'detail_group_intl');
    customer_intl.setLayoutType('normal')
    customer_intl.setDisplayType('hidden');
      
    var allocatedTotal_intl = form.addField('allocated_total_intl', 'integer', 'ALLOCATED TOTAL', null, 'detail_group_intl');
    allocatedTotal_intl.setLayoutType('normal')
    allocatedTotal_intl.setDisplaySize(10, 22);
    allocatedTotal_intl.setDisplayType('hidden');
            
    var totalOrder_intl = form.addField('total_order_line_intl', 'integer', 'TOTAL ORDER', null, 'detail_group_intl');
    totalOrder_intl.setDisplaySize(10, 22);
    totalOrder_intl.setDisplayType('hidden');

    var totalOrderLegacy_intl = form.addField('to_legacy_intl', 'integer', 'TOTAL ORDER', null, 'detail_group_intl');
    totalOrderLegacy_intl.setDisplaySize(10, 22);
    totalOrderLegacy_intl.setDisplayType('hidden');
    
    var remainQty_intl = form.addField('remain_qty_intl', 'integer', 'REMAINING TO BE ORDERED', null, 'detail_group_intl');
    remainQty_intl.setDisplaySize(20, 22);
    remainQty_intl.setDisplayType('hidden');
      
    var fromDate_intl = form.addField('from_date_intl', 'date', 'FROM DATE', null, 'detail_group_intl');
    fromDate_intl.setDisplaySize(10, 22);
    fromDate_intl.setDisplayType('hidden');
        
    var toDate_intl = form.addField('to_date_intl', 'date', 'TO DATE', null, 'detail_group_intl');
    toDate_intl.setDisplaySize(10, 22);
    toDate_intl.setDisplayType('hidden');

    var delCheck_intl = form.addField('del_check_intl','checkbox', 'DELETE', null, 'detail_group_intl');
    delCheck_intl.setDisplayType('hidden');

    var customerList_intl = form.addField('customer_list_intl', 'inlinehtml', 'CUSTOMER LIST', null, 'detail_group_intl');
    customerList_intl.setDisplayType('hidden');
    customerList_intl.setDefaultValue( "<div style='width: 26px;height: 26px;margin-left: 0px;font-size: 12pt;border: solid 2px #f31010;text-align:  center;'>E</div>" );

     /* ================== Excel Export All ===================*/
    
    form = setExportAll(form);

   
    return form;
}

function loadCustomer()
{
    var tmpObj = new Object;

    var filters = [];
    filters.push(new Array('custentity_is_na', 'is', 'T'));
    filters.push('OR');
    filters.push(new Array('custentity_is_intl', 'is', 'T'));

    var cols = [];
    cols.push(new nlobjSearchColumn('custentity_is_na', null, null));
    cols.push(new nlobjSearchColumn('custentity_is_intl', null, null));

    var searchResults = nlapiSearchRecord('customer', null, filters, cols);
    if (searchResults) {
        for (var i = 0; i < searchResults.length; i ++) {
            var element = searchResults[i];
            var customerId = element.getId();
            var isNa = element.getValue(cols[0]);
            var isIntl = element.getValue(cols[1]);
            var customerObj = new Object;
            customerObj.isNa = isNa;
            customerObj.isIntl = isIntl;
            
            tmpObj[customerId] = customerObj;
        }
    }

    return tmpObj;
}

function loadDepartment()
{
    var tmpObj = new Object;
    
    var columns = [];
    columns.push(new nlobjSearchColumn('custrecord_is_na'));
    
    var results = nlapiSearchRecord( 'department', null, null, columns );
    if (results && results.length > 0)
    {   
        for (var i = 0; i < results.length; i ++) 
        {
            var element = results[i];
            var departmentId = element.getId();
            var isNa = element.getValue(columns[0]);

            tmpObj[departmentId] = isNa;
        }
    }

    return tmpObj;
}

function makePageForPost(itemId, displayMode)
{   
    var departmentListObj = loadDepartment();
    var customerListObj = loadCustomer(); 

    var form = makePageForGet(displayMode);
    var customerAllocListObj = getAllocDetails(itemId, departmentListObj, customerListObj);
    var customerAllocList_NA = customerAllocListObj.naArr;
    var customerAllocList_INTL = customerAllocListObj.intlArr;
    var sttDate = '';
    var sttDate1 = '';
    var recInvtotal = customerAllocListObj.recInvtotal;
    var recInvtotal1 = customerAllocListObj.recInvtotal1;
    var itemAllocTotal = 0;
    var itemAllocTotal1 = 0;
    var itemAllocTotal_us = 0;
    var itemAllocTotal1_us = 0;
    var itemAllocTotal_intl = 0;
    var itemAllocTotal1_intl = 0;
    var totalOrder = 0;
    var totalOrder1 = 0;
    var totalOrder_us = 0;
    var totalOrder1_us = 0;
    var totalOrder_intl = 0;
    var totalOrder1_intl = 0;
    var qtyRemainingVal = 0;
    var qtyRemainingVal1 = 0;
    var qtyRemainingVal_us = 0;
    var qtyRemainingVal1_us = 0;
    var qtyRemainingVal_intl = 0;
    var qtyRemainingVal1_intl = 0;
    var firstCustomerId = 0;
    var totalCount = 0;
    var naCount = 0;
    var intlCount = 0;
    
 /******************** North America *********************/ 
    for (var i = 0; i < customerAllocList_NA.length; i ++)
    {
        var itemAllocList = customerAllocList_NA[i];
        var sameCustomerCount = itemAllocList.length;
        var element = itemAllocList[0];
        var fromDate = '' + element.fromDate;
        var allocQty = element.allocQty * 1;
        var orderQty = element.orderQty * 1;
        var toLegacyQty = element.toLegacyQty * 1;
        orderQty += toLegacyQty;
        var departmentId = element.departmentId * 1;
        var customerId = element.customerId * 1;
        var beccaOrderQty = element.beccaOrderQty * 1;
        if (departmentId == 78 && beccaOrderQty > 0) {
            orderQty = beccaOrderQty;
        }
        var remainQty = (allocQty - orderQty) * 1;
        if (remainQty < 0) { remainQty = 0;}
        
        if (i == 0)
        {
            firstCustomerId = element.customerId;
            sttDate = '' + element.sttDate;
            sttDate1 = '' + element.sttDate1;
        }

        var isDepNa = departmentListObj[departmentId];
        var customerObj = customerListObj[customerId];
        var isCusNa = ''; var isCusIntl = '';
        if (customerObj != undefined && customerObj != 'undefined') {
            isCusNa = customerObj.isNa;
            isCusIntl = customerObj.isIntl;
        }

        if (sttDate == fromDate) {
            itemAllocTotal += allocQty;
            totalOrder += orderQty;
            qtyRemainingVal += remainQty;
            if (isDepNa == 'T' || isCusNa == 'T') {
                itemAllocTotal_us += allocQty; totalOrder_us += orderQty; qtyRemainingVal_us += remainQty;
            } else if (isDepNa == 'F' || isCusIntl == 'T') {
                itemAllocTotal_intl += allocQty; totalOrder_intl += orderQty; qtyRemainingVal_intl += remainQty;
            } 
        }
        if (sttDate1 == fromDate) {
            itemAllocTotal1 += allocQty;
            totalOrder1 += orderQty;
            qtyRemainingVal1 += remainQty;    
            if (isDepNa == 'T' || isCusNa == 'T') {
                itemAllocTotal1_us += allocQty; totalOrder1_us += orderQty; qtyRemainingVal1_us += remainQty;
            } else if (isDepNa == 'F' || isCusIntl == 'T') {
                itemAllocTotal1_intl += allocQty; totalOrder1_intl += orderQty; qtyRemainingVal1_intl += remainQty;
            }
        }
        
        totalCount ++; naCount ++;
        form = makeFormLineForPost(form, true, element, sameCustomerCount, totalCount, displayMode, 'na');
      
        for (var j = 1; j < itemAllocList.length; j ++) 
        {
            var element = itemAllocList[j];
            var fromDate = '' + element.fromDate;
            var allocQty = element.allocQty * 1;
            var orderQty = element.orderQty * 1;
            var toLegacyQty = element.toLegacyQty * 1;
            orderQty += toLegacyQty;
            var departmentId = element.departmentId * 1;
            var customerId = element.customerId * 1;
            var beccaOrderQty = element.beccaOrderQty * 1;
            if (departmentId == 78 && beccaOrderQty > 0) {
                orderQty = beccaOrderQty;
            }
            var remainQty = (allocQty - orderQty) * 1;
            if (remainQty < 0) { remainQty = 0;}
            
            var isDepNa = departmentListObj[departmentId];
            var customerObj = customerListObj[customerId];
            var isCusNa = ''; var isCusIntl = '';
            if (customerObj != undefined && customerObj != 'undefined') {
                isCusNa = customerObj.isNa;
                isCusIntl = customerObj.isIntl;
            }

            if (sttDate == fromDate) {
                itemAllocTotal += allocQty;
                totalOrder += orderQty;
                qtyRemainingVal += remainQty;
                if (isDepNa == 'T' || isCusNa == 'T') {
                    itemAllocTotal_us += allocQty; totalOrder_us += orderQty; qtyRemainingVal_us += remainQty;
                } else if (isDepNa == 'F' || isCusIntl == 'T') {
                    itemAllocTotal_intl += allocQty; totalOrder_intl += orderQty; qtyRemainingVal_intl += remainQty;
                } 
            }
            if (sttDate1 == fromDate) {
                itemAllocTotal1 += allocQty;
                totalOrder1 += orderQty;
                qtyRemainingVal1 += remainQty;    
                if (isDepNa == 'T' || isCusNa == 'T') {
                    itemAllocTotal1_us += allocQty; totalOrder1_us += orderQty; qtyRemainingVal1_us += remainQty;
                } else if (isDepNa == 'F' || isCusIntl == 'T') {
                    itemAllocTotal1_intl += allocQty; totalOrder1_intl += orderQty; qtyRemainingVal1_intl += remainQty;
                }
            }

            totalCount ++; naCount ++;
            form = makeFormLineForPost(form, false, element, 0,totalCount, displayMode, 'na');
        }
    }

/***************************** INTL ***************************************/
    for (var i = 0; i < customerAllocList_INTL.length; i ++)
    {
        var itemAllocList = customerAllocList_INTL[i];
        var sameCustomerCount = itemAllocList.length;
        var element = itemAllocList[0];
        var fromDate = '' + element.fromDate;
        var allocQty = element.allocQty * 1;
        var orderQty = element.orderQty * 1;
        var toLegacyQty = element.toLegacyQty * 1;
        orderQty += toLegacyQty;
        var departmentId = element.departmentId * 1;
        var customerId = element.customerId * 1;
        var beccaOrderQty = element.beccaOrderQty * 1;
        if (departmentId == 78 && beccaOrderQty > 0) {
            orderQty = beccaOrderQty;
        }
        var remainQty = (allocQty - orderQty) * 1;
        if (remainQty < 0) { remainQty = 0;}
        
        if (i == 0)
        {
            firstCustomerId = element.customerId;
            sttDate = '' + element.sttDate;
            sttDate1 = '' + element.sttDate1;
        }

        var isDepNa = departmentListObj[departmentId];
        var customerObj = customerListObj[customerId];
        var isCusNa = ''; var isCusIntl = '';
        if (customerObj != undefined && customerObj != 'undefined') {
            isCusNa = customerObj.isNa;
            isCusIntl = customerObj.isIntl;
        }

        if (sttDate == fromDate) {
            itemAllocTotal += allocQty;
            totalOrder += orderQty;
            qtyRemainingVal += remainQty;
            if (isDepNa == 'T' || isCusNa == 'T') {
                itemAllocTotal_us += allocQty; totalOrder_us += orderQty; qtyRemainingVal_us += remainQty;
            } else if (isDepNa == 'F' || isCusIntl == 'T') {
                itemAllocTotal_intl += allocQty; totalOrder_intl += orderQty; qtyRemainingVal_intl += remainQty;
            } 
        }
        if (sttDate1 == fromDate) {
            itemAllocTotal1 += allocQty;
            totalOrder1 += orderQty;
            qtyRemainingVal1 += remainQty;    
            if (isDepNa == 'T' || isCusNa == 'T') {
                itemAllocTotal1_us += allocQty; totalOrder1_us += orderQty; qtyRemainingVal1_us += remainQty;
            } else if (isDepNa == 'F' || isCusIntl == 'T') {
                itemAllocTotal1_intl += allocQty; totalOrder1_intl += orderQty; qtyRemainingVal1_intl += remainQty;
            }
        }
        
        totalCount ++; intlCount ++;
        form = makeFormLineForPost(form, true, element, sameCustomerCount, totalCount, displayMode, 'intl', i + 1);
      
        for (var j = 1; j < itemAllocList.length; j ++) 
        {
            var element = itemAllocList[j];
            var fromDate = '' + element.fromDate;
            var allocQty = element.allocQty * 1;
            var orderQty = element.orderQty * 1;
            var toLegacyQty = element.toLegacyQty * 1;
            orderQty += toLegacyQty;
            var departmentId = element.departmentId * 1;
            var customerId = element.customerId * 1;
            var beccaOrderQty = element.beccaOrderQty * 1;
            if (departmentId == 78 && beccaOrderQty > 0) {
                orderQty = beccaOrderQty;
            }
            var remainQty = (allocQty - orderQty) * 1;
            if (remainQty < 0) { remainQty = 0;}
            
            var isDepNa = departmentListObj[departmentId];
            var customerObj = customerListObj[customerId];
            var isCusNa = ''; var isCusIntl = '';
            if (customerObj != undefined && customerObj != 'undefined') {
                isCusNa = customerObj.isNa;
                isCusIntl = customerObj.isIntl;
            }

            if (sttDate == fromDate) {
                itemAllocTotal += allocQty;
                totalOrder += orderQty;
                qtyRemainingVal += remainQty;
                if (isDepNa == 'T' || isCusNa == 'T') {
                    itemAllocTotal_us += allocQty; totalOrder_us += orderQty; qtyRemainingVal_us += remainQty;
                } else if (isDepNa == 'F' || isCusIntl == 'T') {
                    itemAllocTotal_intl += allocQty; totalOrder_intl += orderQty; qtyRemainingVal_intl += remainQty;
                } 
            }
            if (sttDate1 == fromDate) {
                itemAllocTotal1 += allocQty;
                totalOrder1 += orderQty;
                qtyRemainingVal1 += remainQty;    
                if (isDepNa == 'T' || isCusNa == 'T') {
                    itemAllocTotal1_us += allocQty; totalOrder1_us += orderQty; qtyRemainingVal1_us += remainQty;
                } else if (isDepNa == 'F' || isCusIntl == 'T') {
                    itemAllocTotal1_intl += allocQty; totalOrder1_intl += orderQty; qtyRemainingVal1_intl += remainQty;
                }
            }

            totalCount ++; intlCount ++;
            form = makeFormLineForPost(form, false, element, 0,totalCount, displayMode, 'intl', 0);
        }
    }

    var item = form.getField('alloc_item');
    item.setDefaultValue(itemId);

    var stt_date = form.getField('stt_date');
    stt_date.setDefaultValue(sttDate);

    var stt_date_1 = form.getField('stt_date_1');
    stt_date_1.setDefaultValue(sttDate1);

    var rec_inv_total = form.getField('inv_alloc_total');
    rec_inv_total.setDefaultValue(recInvtotal);

    var rec_inv_total_1 = form.getField('inv_alloc_total_1');
    rec_inv_total_1.setDefaultValue(recInvtotal1);

    var totalAllocated = form.getField('total_allocated');
    totalAllocated.setDefaultValue(itemAllocTotal);

    var totalAllocated_us = form.getField('total_allocated_us');
    totalAllocated_us.setDefaultValue(itemAllocTotal_us);
    var totalAllocated_intl = form.getField('total_allocated_intl');
    totalAllocated_intl.setDefaultValue(itemAllocTotal_intl);

    var totalAllocated1 = form.getField('total_allocated_1');
    totalAllocated1.setDefaultValue(itemAllocTotal1);

    var totalAllocated_us_1 = form.getField('total_allocated_us_1');
    totalAllocated_us_1.setDefaultValue(itemAllocTotal1_us);
    var totalAllocated_intl_1 = form.getField('total_allocated_intl_1');
    totalAllocated_intl_1.setDefaultValue(itemAllocTotal1_intl);

    var availableQty = recInvtotal - itemAllocTotal;
    var avaQtyFld = form.getField('qty_available');
    avaQtyFld.setDefaultValue(availableQty);

    var availableQty1 = recInvtotal1 - itemAllocTotal1;
    var avaQtyFld1 = form.getField('qty_available_1');
    avaQtyFld1.setDefaultValue(availableQty1);

    var boFulfillQty = getBackOrderFulfilled(itemId);
    var boFulfillFld = form.getField('backorder_fulfilled');
    boFulfillFld.setDefaultValue(boFulfillQty);

    var totalOrdFLFld = form.getField('total_order_fulfill');
    totalOrdFLFld.setDefaultValue(totalOrder);

    var totalOrderFld_us = form.getField('total_order_us');
    totalOrderFld_us.setDefaultValue(totalOrder_us);
    var totalOrderFld_intl = form.getField('total_order_intl');
    totalOrderFld_intl.setDefaultValue(totalOrder_intl);

    var totalOrdFLFld1 = form.getField('total_order_fulfill_1');
    totalOrdFLFld1.setDefaultValue(totalOrder1);

    var totalOrderFld1_us = form.getField('total_order_us_1');
    totalOrderFld1_us.setDefaultValue(totalOrder1_us);
    var totalOrderFld1_intl = form.getField('total_order_intl_1');
    totalOrderFld1_intl.setDefaultValue(totalOrder1_intl);

    var qtyRemainingFld = form.getField('qty_remaining_all');
    qtyRemainingFld.setDefaultValue(qtyRemainingVal);

    var qtyRemainingFld_us = form.getField('qty_remaining_us');
    qtyRemainingFld_us.setDefaultValue(qtyRemainingVal_us);
    var qtyRemainingFld_intl = form.getField('qty_remaining_intl');
    qtyRemainingFld_intl.setDefaultValue(qtyRemainingVal_intl);

    var qtyRemainingFld1 = form.getField('qty_remaining_all_1');
    qtyRemainingFld1.setDefaultValue(qtyRemainingVal1);

    var qtyRemainingFld1_us = form.getField('qty_remaining_us_1');
    qtyRemainingFld1_us.setDefaultValue(qtyRemainingVal1_us);
    var qtyRemainingFld1_intl = form.getField('qty_remaining_intl_1');
    qtyRemainingFld1_intl.setDefaultValue(qtyRemainingVal1_intl);

    /* =============== Parameters ================*/
    var first_customer = form.getField('first_customer');
    first_customer.setDefaultValue(firstCustomerId);

    var total_count_fld = form.getField('total_count');
    total_count_fld.setDefaultValue(totalCount);

    var na_count_fld = form.getField('na_count');
    na_count_fld.setDefaultValue(naCount);

    var intl_count_fld = form.getField('intl_count');
    intl_count_fld.setDefaultValue(intlCount);
    
    /* ================ Excel Export Per Item ===============*/
    if (totalCount > 0)
    {      
        var totalOrdFLQty = 0;
        var columns = nlapiLookupField('item', itemId, ['itemid', 'displayname']);
        var itemSKU = columns.itemid;
        var dispName = columns.displayname;
        var itemName = itemSKU + "   " + dispName;
        var excelHtml = makeExcelHtml(itemName, recInvtotal, itemAllocTotal, totalOrdFLQty, availableQty, boFulfillQty, qtyRemainingVal, customerAllocList_NA, customerAllocList_INTL);
        var excel_export_html = form.getField('excel_export_html');
        excel_export_html.setDefaultValue( excelHtml );
    } else {
        var button = form.getButton('excel_export');
        button.setVisible(false);
    }
    
   
    return form;
}

function makeFormLineForPost(form, isMain, element, sameCustomerCount, allCount, displayMode, mainRegionId, intlStart)
{   
    intlStart = intlStart * 1;
    regionId = '_' + mainRegionId;
    var groupId = 'detail_group_' + regionId;

    var allocId = element.allocId;
    var rangeId = element.rangeId; 
    var departmentId = element.departmentId * 1;
    var customerId = element.customerId;
    var customerName = element.customerName;
    var locationId = element.locationId;
    var locationName = element.locationName;
    var allocQty = element.allocQty * 1;
    var orderQty = element.orderQty * 1;
    var toLegacyQty = element.toLegacyQty * 1;
    orderQty += toLegacyQty;
    var beccaOrderQty = element.beccaOrderQty * 1;
    if (departmentId == 78 && beccaOrderQty > 0) { orderQty = beccaOrderQty;}
    var fromDate = element.fromDate;
    var toDate = element.toDate;
    
    var remainQty = (allocQty - orderQty) * 1;
    if (remainQty < 0) { remainQty = 0;}

    var index = allCount;
        
    var allocRec = form.addField('alloc_rec_' + index, 'integer', 'ALLOCATION RECORD INDEX', null, groupId);
    allocRec.setLayoutType('normal')
    allocRec.setDisplayType('hidden');
    allocRec.setDefaultValue(allocId);
    form.insertField(allocRec, 'alloc_rec' + regionId);
    allocRec.setLabel('Allocation Record Index');
    
    var rangeRec = form.addField('range_rec_' + index, 'integer', 'RANGE RECORD INDEX', null, groupId);
    rangeRec.setLayoutType('normal')
    rangeRec.setDisplayType('hidden');
    rangeRec.setDefaultValue(rangeId);
    form.insertField(rangeRec, 'range_rec' + regionId);
    rangeRec.setLabel('Range Record Index');
    
    var department = form.addField('department_' + index,'select', 'DEPARTMENT', 'department', groupId);
 //   department.setMandatory( true );
    department.setDefaultValue(departmentId);
    form.insertField(department, 'department' + regionId);
    department.setLabel('department');
    department.setLayoutType('normal')
    department.setDisplayType(displayMode);
  
    var customer = form.addField('customer_' + index,'select', '', 'customer', groupId);
 //   customer.setMandatory( true );
    customer.setDefaultValue(customerId);
    form.insertField(customer, 'customer' + regionId);
    customer.setLabel('Customer');
    customer.setLayoutType('normal')
    customer.setDisplayType(displayMode);
  //  customer.setDisplaySize(30, 22);
    if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
    {
        customer.setBreakType('startcol');
    }
    
    var allocatedTotal = form.addField('allocated_total_' + index, 'integer', null, groupId);
    allocatedTotal.setDisplaySize(10, 22);
    allocatedTotal.setDefaultValue(allocQty);
    form.insertField(allocatedTotal, 'allocated_total' + regionId);
    allocatedTotal.setLabel('Allocated Qty');
//    allocatedTotal.setMandatory( true );
    allocatedTotal.setDisplayType(displayMode);
    if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
    {
        allocatedTotal.setBreakType('startcol');
    }

    var totalOrder = form.addField('total_order_' + index, 'integer', null, groupId);
    totalOrder.setDisplaySize(10, 22);
    totalOrder.setDefaultValue(orderQty); 
    totalOrder.setDisplayType('disabled');
    form.insertField(totalOrder, 'total_order_line' + regionId);
    totalOrder.setLabel('Total Ordered');
//    totalOrder.setMandatory( true );
    if (displayMode == 'normal'){
        if (departmentId == 78) {
            totalOrder.setDisplayType('normal');
        } else {
            totalOrder.setDisplayType('disabled');
        }
    }else{
        totalOrder.setDisplayType(displayMode);
    }
    if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
    {
        totalOrder.setBreakType('startcol');
    }

    var totalOrderLegacy = form.addField('to_legacy_' + index, 'integer', null, groupId);
    totalOrderLegacy.setDisplaySize(20, 22);
    totalOrderLegacy.setDefaultValue(toLegacyQty); 
//    totalOrderLegacy.setDisplayType('disabled');
    totalOrderLegacy.setDisplayType('hidden');
    form.insertField(totalOrderLegacy, 'to_legacy' + regionId);
    totalOrderLegacy.setLabel('Total Order_Legacy');
//    totalOrder.setMandatory( true );
    if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
    {
        totalOrderLegacy.setBreakType('startcol');
    }

    var remainOrder = form.addField('remain_qty_' + index, 'integer', null, groupId);
    remainOrder.setDisplaySize(25, 22);
    remainOrder.setDefaultValue(remainQty);
    remainOrder.setDisplayType('disabled');
    form.insertField(remainOrder, 'remain_qty' + regionId);
    remainOrder.setLabel('Remaining To Be Ordered');
//    remainOrder.setMandatory( true );
    remainOrder.setDisplayType(displayMode);
    if (displayMode == 'normal'){
        remainOrder.setDisplayType('disabled');
    } else {
        remainOrder.setDisplayType(displayMode);
    }
    if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
    {
        remainOrder.setBreakType('startcol');
    }

    var fromDateFld = form.addField('from_date_' + index, 'date', null, groupId);
    fromDateFld.setDisplaySize(10, 22);
    fromDateFld.setDefaultValue(fromDate);
    form.insertField(fromDateFld, 'from_date' + regionId);
    fromDateFld.setLabel('From Date');
//    fromDateFld.setMandatory(true);
    fromDateFld.setDisplayType(displayMode);
    if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
    {
        fromDateFld.setBreakType('startcol');
    }

    var toDateFld = form.addField('to_date_' + index, 'date', null, groupId);
    toDateFld.setDisplaySize(10, 22);
    toDateFld.setDefaultValue(toDate);
    form.insertField(toDateFld, 'to_date' + regionId);
    toDateFld.setLabel('To Date');
//    toDateFld.setMandatory(true);
    toDateFld.setDisplayType(displayMode);
    toDateFld.setDisplayType(displayMode);
    if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
    {
        toDateFld.setBreakType('startcol');
    }

    var delCheck = form.addField('del_check_' + index,'checkbox', 'DELETE', null, groupId);
    form.insertField(delCheck, 'del_check' + regionId);
    delCheck.setLabel('Delete');
    if (displayMode == 'inline') {
       delCheck.setDisplayType('hidden');
    }
    if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
    {
        delCheck.setBreakType('startcol');
    }  
  
    if (isMain)
    {
        var customerList = form.addField('customer_list_' + index, 'inlinehtml', null, groupId);
        form.insertField(customerList, 'customer_list' + regionId);
        if (allCount == 1 || (mainRegionId == 'intl' && intlStart == 1))
        {
            customerList.setBreakType('startcol');
        }
        customerList.setDefaultValue( "<div class='main_customer base_class' status='1' customerId='" + allCount + "' sameCustomerCount='" + sameCustomerCount + "'allocQty='"+allocQty+"' orderQty='"+orderQty+"' remainQty='"+remainQty+"' style='margin-top:30px; font-family: Andalus; color: #2c5987; background-color: white; font-size: 12pt; padding-left: 4px; padding-right: 6px; float: left;-webkit-transition: background-color 0.5s ease-out; -moz-transition: background-color 0.5s ease-out; -o-transition: background-color 0.5s ease-out; transition: background-color 0.5s ease-out box-shadow 0.5s ease-out; -webkit-font-smoothing: antialiased;'></div>" );
    }
    
    return form;
}

function makeExcelHtml(itemName, rec_inv_total, totalAllocated, totalOrdFL, availableQty, boFulfillQty, qtyRemaining, customerAllocList_NA, customerAllocList_INTL)
{   
    var htmlData = "<div>";
    htmlData += "<script src='https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js'></script>";
    htmlData += "<script src='https://system.na1.netsuite.com/core/media/media.nl?id=148141&c=3945539&h=86a758a1e1e98e4551fb&_xt=.js'></script>";;
    htmlData += "<script src='https://system.na1.netsuite.com/core/media/media.nl?id=148140&c=3945539&h=7e1f359172f1f08579fb&_xt=.js'></script>";
    htmlData += "<table id='tbl_obj' style='display:none'>";
    htmlData += "<tr>";
    htmlData += "<td>ItemID</td>";
    htmlData += "<td>Item</td>";
    htmlData += "<td>INVENTORY ALLOCATION TOTAL</td>";
    htmlData += "<td>TOTAL ALLOCATED</td>";
    htmlData += "<td>TOTAL ORDER BACKORDER FULFILLED</td>";
    htmlData += "<td>QTY AVAILABLE</td>";
    htmlData += "<td>BACKORDER FULFILLED</td>";
    htmlData += "<td>QTY REMAINING</td>";
    htmlData += "<td>DEPARTMENT</td>";
    htmlData += "<td>CUSTOMER</td>";
    htmlData += "<td>ALLOCATED QTY</td>";
    htmlData += "<td>TOTAL ORDERED</td>";
    htmlData += "<td>REMAINING TO BE ORDERED</td>";
    htmlData += "<td>FROM DATE</td>";
    htmlData += "<td>TO DATE</td>";
    htmlData += "</tr>";
    htmlData += "<tr>";
    htmlData += "<td colspan='15' style='text-align:center'>North America</td>";
    htmlData += "</tr>";
    for (var i = 0; i < customerAllocList_NA.length; i ++)
    {
        var itemAllocList = customerAllocList_NA[i];
        for (var j = 0; j < itemAllocList.length; j ++) 
        {
            var element = itemAllocList[j];
            var allocId = element.allocId;
            var rangeId = element.rangeId; 
            var itemId = element.itemId;
            var customerId = element.customerId;
            var departmentId = element.departmentId * 1;
            var departmentName = element.departmentName;
            var customerName = element.customerName;
            var locationId = element.locationId;
            var locationName = element.locationName;
            var allocQty = element.allocQty * 1;
            var orderQty = element.orderQty * 1;
            var toLegacyQty = element.toLegacyQty;
            orderQty += toLegacyQty;
            var beccaOrderQty = element.beccaOrderQty * 1;
            if (departmentId == 78 && beccaOrderQty > 0) {orderQty = beccaOrderQty;}
            var fromDate = element.fromDate;
            var toDate = element.toDate;
            var remainQty = (allocQty - orderQty) * 1;

            if (i > 0 || j > 0)
            {
                itemName = '';
                rec_inv_total = '';
                totalAllocated = '';
                availableQty = '';
                boFulfillQty = '';
                qtyRemaining = '';
                totalOrdFL = '';
            }

            htmlData += "<tr>";
            htmlData += "<td>" + itemId + "</td>";
            htmlData += "<td>" + itemName + "</td>";
            htmlData += "<td>" + rec_inv_total + "</td>";
            htmlData += "<td>" + totalAllocated + "</td>";
            htmlData += "<td>" + totalOrdFL + "</td>";
            htmlData += "<td>" + availableQty + "</td>";
            htmlData += "<td>" + boFulfillQty + "</td>";
            htmlData += "<td>" + qtyRemaining + "</td>";
            htmlData += "<td>" + departmentName + "</td>";
            htmlData += "<td>" + customerName + "</td>";
            htmlData += "<td>" + allocQty + "</td>";
            htmlData += "<td>" + orderQty + "</td>";
            htmlData += "<td>" + remainQty + "</td>";
            htmlData += "<td>" + fromDate + " 05:00:00 AM" + "</td>";
            htmlData += "<td>" + toDate + " 05:00:00 AM" + "</td>";
            htmlData += "</tr>";
        }
    }

    htmlData += "<tr>";
    htmlData += "<td colspan='15' style='text-align:center'>International</td>";
    htmlData += "</tr>";
    for (var i = 0; i < customerAllocList_INTL.length; i ++)
    {
        var itemAllocList = customerAllocList_INTL[i];
        for (var j = 0; j < itemAllocList.length; j ++) 
        {
            var element = itemAllocList[j];
            var allocId = element.allocId;
            var rangeId = element.rangeId; 
            var itemId = element.itemId;
            var customerId = element.customerId;
            var departmentId = element.departmentId * 1;
            var departmentName = element.departmentName;
            var customerName = element.customerName;
            var locationId = element.locationId;
            var locationName = element.locationName;
            var allocQty = element.allocQty * 1;
            var orderQty = element.orderQty * 1;
            var toLegacyQty = element.toLegacyQty * 1;
            orderQty += toLegacyQty;
            var beccaOrderQty = element.beccaOrderQty * 1;
            if (departmentId == 78 && beccaOrderQty > 0) {orderQty = beccaOrderQty;}
            var fromDate = element.fromDate;
            var toDate = element.toDate;
            var remainQty = (allocQty - orderQty) * 1;

            if (i > 0 || j > 0)
            {
                itemName = '';
                rec_inv_total = '';
                totalAllocated = '';
                availableQty = '';
                boFulfillQty = '';
                qtyRemaining = '';
                totalOrdFL = '';
            }

            htmlData += "<tr>";
            htmlData += "<td>" + itemId + "</td>";
            htmlData += "<td>" + itemName + "</td>";
            htmlData += "<td>" + rec_inv_total + "</td>";
            htmlData += "<td>" + totalAllocated + "</td>";
            htmlData += "<td>" + totalOrdFL + "</td>";
            htmlData += "<td>" + availableQty + "</td>";
            htmlData += "<td>" + boFulfillQty + "</td>";
            htmlData += "<td>" + qtyRemaining + "</td>";
            htmlData += "<td>" + departmentName + "</td>";
            htmlData += "<td>" + customerName + "</td>";
            htmlData += "<td>" + allocQty + "</td>";
            htmlData += "<td>" + orderQty + "</td>";
            htmlData += "<td>" + remainQty + "</td>";
            htmlData += "<td>" + fromDate + " 05:00:00 AM" + "</td>";
            htmlData += "<td>" + toDate + " 05:00:00 AM" + "</td>";
            htmlData += "</tr>";
        }
    }    
    htmlData += "</table>";
    htmlData += "</div>";

    return htmlData;
}

/*================================================ Database ===================================================*/
function populateAllocCheckedItems()
{
    var itemList = [];
    var filters = [];
    filters[0] = new nlobjSearchFilter( 'custitem_item_alloc_check', null, 'is', 'T' );

    var columns = [];
    columns[0] = new nlobjSearchColumn( 'itemid' );
    columns[1] = new nlobjSearchColumn( 'displayname' );
     
    var searchresults = nlapiSearchRecord( 'item', null, filters, columns );
    if ( searchresults != null && searchresults.length > 0 ) 
    {
        for (var i = 0; i < searchresults.length; i ++)
        {
            var element = searchresults[i];
            var itemObj = new Object;
            itemObj.internalId = element.getId();
            itemObj.itemType = element.getRecordType();
            itemObj.itemSKU = element.getValue(columns[0]);
            itemObj.dispName = element.getValue(columns[1]);
            itemList.push(itemObj);
        }
    }

    return itemList;
}

function getBackOrderFulfilled(itemId)
{
    dLog('here1', 'here1');
    var totalQty = 0;
    var filters = [];
    filters.push(new nlobjSearchFilter('item', null, 'anyof', itemId));
    var results = nlapiSearchRecord( 'transaction', 'customsearch566_2', filters, null);
    dLog('here2', 'here2');
    if (results && results.length > 0)
    {   
        var cols = results[0].getAllColumns();
        var element = results[0];
        totalQty = element.getValue(cols[1]);
    }

    return totalQty;
}

function getAllocDetails(itemId, departmentListObj, customerListObj)
{
    var recInvtotal = 0;
    var recInvtotal1 = 0;
    var allocItemList = [];
    var filters = [];
    filters.push(new nlobjSearchFilter('custrecord_item_alloc_sku', null, 'anyof', itemId));
    var results = nlapiSearchRecord( 'customrecord_item_alloc', 'customsearch_item_alloc_search', filters, null);
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
            itemObj.locationId = element.getValue(cols[2]);
            itemObj.locationName = element.getText(cols[2]);
            itemObj.allocQty = element.getValue(cols[3]);
            itemObj.fromDate = element.getValue(cols[4]);
            itemObj.toDate = element.getValue(cols[5]);
            itemObj.rangeId = element.getValue(cols[6]);
            itemObj.recInvtotal = element.getValue(cols[7]) * 1;
            itemObj.departmentId = element.getValue(cols[9]); 
            itemObj.departmentName = element.getText(cols[9]); 
            itemObj.sttDate = element.getValue(cols[10]); 
            itemObj.recInvtotal1 = element.getValue(cols[11]) * 1;
            itemObj.sttDate1 = element.getValue(cols[12]); 
            itemObj.beccaOrderQty = element.getValue(cols[13]); 
            itemObj.toLegacyQty = element.getValue(cols[14]); 
            itemObj.orderQty = 0;

            if (itemObj.recInvtotal > recInvtotal) {
                recInvtotal = itemObj.recInvtotal;
            }
            if (itemObj.recInvtotal1 > recInvtotal1) {
                recInvtotal1 = itemObj.recInvtotal1;
            }

       //     recInvtotal += itemObj.recInvtotal;
       //     recInvtotal1 += itemObj.recInvtotal1;
            allocItemList.push(itemObj);
        }
    }
/*
    if (allocItemList && allocItemList.length > 0) {
        allocItemList[0].recInvtotal = recInvtotal;
        allocItemList[0].recInvtotal1 = recInvtotal1;
    }
*/    
    var totalOrderObj = getItemTotalOrder(itemId);
    var depOrderObj = totalOrderObj.depOrderObj;
    var cusOrderObj = totalOrderObj.cusOrderObj;
    
    dLog('totalOrderObj', JSON.stringify(totalOrderObj));
  
    for (var i = 0; i < allocItemList.length; i ++)
    {
        var departmentId = allocItemList[i].departmentId;
        var customerId = allocItemList[i].customerId;
        var fromDate = allocItemList[i].fromDate;
        var toDate = allocItemList[i].toDate;
        var detailArr = [];
        if (departmentId) {
            detailArr = depOrderObj[departmentId];
        } else {
            detailArr = cusOrderObj[customerId];
        }
        if (detailArr != undefined && detailArr != 'undefined' && detailArr.length > 0)
        {
            for (var k = 0; k < detailArr.length; k ++)
            {
                var detailObj = detailArr[k];
                var shipWindow = detailObj['shipWindow'];
                var orderQty = detailObj['orderQty'] * 1;

                var tmpArr = shipWindow.split(" ~ ");
                var tmpFromDate = '';
                var tmpToDate = '';
                if (tmpArr != undefined && tmpArr != 'undefined') {
                    if (tmpArr[0] != undefined && tmpArr[0] != 'undefined') {
                        tmpFromDate = tmpArr[0].split(' ')[1];          
                    }
                    if (tmpArr[1] != undefined && tmpArr[1] != 'undefined') {
                        tmpToDate = tmpArr[1].split(' ')[0];        
                    }
                }
                
                if (fromDate == tmpFromDate && toDate == tmpToDate)
                {
                    allocItemList[i].orderQty += orderQty;
            //        break;
                }
            }
        }
    }

    var allocItemListObj = groupSameCustomers(allocItemList, departmentListObj, customerListObj);
    allocItemListObj.recInvtotal = recInvtotal;
    allocItemListObj.recInvtotal1 = recInvtotal1;
    return allocItemListObj;
}

function groupSameCustomers(allocItemList, departmentListObj, customerListObj)
{
    dLog('customerListObj', JSON.stringify(customerListObj));
    var tmpObj = new Object;
    var reportArr = [];
    var _reportArr = [];
    var detailArr = [];
    var _detailArr = [];
    var oldDepartmentId = -1;
    var _oldDepartmentId = -1;
    var oldCustomerId = -1;
    var _oldCustomerId = -1;
    var detailCount = 0;
    var _detailCount = 0;
    for (var i = 0; i < allocItemList.length; i ++)
    {
        var element = allocItemList[i];
        var departmentId = element.departmentId;
        var customerId = element.customerId;
        var isDepNa = departmentListObj[departmentId];
        var customerObj = customerListObj[customerId];
        var isCusNa = ''; var isCusIntl = '';
        if (customerObj) {
            isCusNa = customerObj.isNa;
            isCusIntl = customerObj.isIntl;
        }
        if (isCusNa == 'T' || isDepNa == 'T') {
            if (departmentId) {
                if (oldDepartmentId != departmentId)
                {
                    detailArr = [];
                    detailCount ++;
                }

                detailArr[detailArr.length] = element;
                reportArr[detailCount - 1] = detailArr;
                oldDepartmentId = departmentId;
            } else {
            //    if (customerId) {
                    if (oldCustomerId != customerId)
                    {
                        detailArr = [];
                        detailCount ++;
                    }

                    detailArr[detailArr.length] = element;
                    reportArr[detailCount - 1] = detailArr;
                    oldCustomerId = customerId;
            //    }
            }
        } else/* if (isCusIntl == 'T' || isDepNa == 'F') */{
            if (departmentId) {
                    if (_oldDepartmentId != departmentId)
                    {
                        _detailArr = [];
                        _detailCount ++;
                    }

                    _detailArr[_detailArr.length] = element;
                    _reportArr[_detailCount - 1] = _detailArr;
                    _oldDepartmentId = departmentId;
            } else {
            //    if (customerId) {
                    if (_oldCustomerId != customerId)
                    {
                        _detailArr = [];
                        _detailCount ++;
                    }

                    _detailArr[_detailArr.length] = element;
                    _reportArr[_detailCount - 1] = _detailArr;
                    _oldCustomerId = customerId;
            //    }
            }
        }
    }
    
    tmpObj.naArr = reportArr;
    tmpObj.intlArr = _reportArr;
    return tmpObj;
}

function getDepartmentParentId(departmentId)
{
    var depRec = nlapiLoadRecord('department', departmentId);
    var parentDepId = depRec.getFieldValue('parent');
    var parentDepName = depRec.getFieldText('parent');

    return parentDepId;
}

function getItemTotalOrder(itemId)
{
    var totalOrderObj = new Object;
    var depOrderObj = new Object;
    var cusOrderObj = new Object;

    var filters = [];
    filters.push(new nlobjSearchFilter('item', null, 'anyof', itemId));
    var results = nlapiSearchRecord( 'transaction', 'customsearch562_2', filters, null);
  
    if (results && results.length > 0)
    {   
        var depDetailArr = [];
        var oldDepartmentId = 0;
        var cusDetailArr = [];
        var oldCustomerId = 0;
        var cols = results[0].getAllColumns();
        for (var i = 0; i < results.length; i ++) 
        {   
            var element = results[i];
            var IsDepAllocated = element.getValue(cols[1]);
            var customerId = element.getValue(cols[2]);
            var departmentId = element.getValue(cols[3]);
            var shipWindow = element.getValue(cols[4]);
          //  var orderQty = element.getValue(cols[5]);
            var orderQty = element.getValue(cols[7]);

            if (departmentId) {
                var parentDepId = getDepartmentParentId(departmentId);
                if (parentDepId == 32) { // Sephora : SEA
                    departmentId = parentDepId;
                }
            }

            if (IsDepAllocated == 'T') {
                var detailObj = new Object;
                detailObj.shipWindow = shipWindow;
                detailObj.orderQty = orderQty;

                if (oldDepartmentId != departmentId)
                {
                    depDetailArr = [];
                }

                depDetailArr.push(detailObj);
                depOrderObj[departmentId] = depDetailArr;
                oldDepartmentId = departmentId;
            } else {
                var detailObj = new Object;
                detailObj.shipWindow = shipWindow;
                detailObj.orderQty = orderQty;

                if (oldCustomerId != customerId)
                {
                    cusDetailArr = [];
                }

                cusDetailArr.push(detailObj);
                cusOrderObj[customerId] = cusDetailArr;
                oldCustomerId = customerId;
            }
        }
    }

    totalOrderObj.depOrderObj = depOrderObj;
    totalOrderObj.cusOrderObj = cusOrderObj;
    return totalOrderObj;
}

/*================ ALL EXPORT ===============*/
function makeAllExcelHtml(customerAllocList)
{   
    var htmlData = "<div>";
    htmlData += '<script src="https://code.jquery.com/jquery-1.12.4.js"></script>';
    htmlData += '<link rel="stylesheet" href="//code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css">';
    htmlData += '<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.js"></script>';
    htmlData += "<table id='tbl_obj_all' style='display:none'>";
    htmlData += "<tr>";
    htmlData += "<td>ItemID</td>";
    htmlData += "<td>Item</td>";
    htmlData += "<td>INVENTORY ALLOCATION TOTAL</td>";
    htmlData += "<td>TOTAL ALLOCATED</td>";
    htmlData += "<td>TOTAL ORDER BACKORDER FULFILLED</td>";
    htmlData += "<td>QTY AVAILABLE</td>";
    htmlData += "<td>BACKORDER FULFILLED</td>";
    htmlData += "<td>QTY REMAINING</td>";
    htmlData += "<td>DEPARTMENT</td>";
    htmlData += "<td>CUSTOMER</td>";
    htmlData += "<td>ALLOCATED QTY</td>";
    htmlData += "<td>TOTAL ORDERED</td>";
    htmlData += "<td>REMAINING TO BE ORDERED</td>";
    htmlData += "<td>FROM DATE</td>";
    htmlData += "<td>TO DATE</td>";
    htmlData += "</tr>";

    var boItemListObj = getBackOrderFulfilledAll();
    var totalOrdFLQty = 0;
    var totalOrdFLDisp = "";
    var oldItemId = 0;
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
            var toLegacyQty = element.toLegacyQty * 1;
            orderQty += toLegacyQty;
            var beccaOrderQty = element.beccaOrderQty * 1;
            if (departmentId == 78 && beccaOrderQty > 0) {orderQty = beccaOrderQty;}
            var fromDate = element.fromDate;
            var toDate = element.toDate;
            var remainQty = (allocQty - orderQty) * 1;
            var recInvtotal = element.recInvtotal * 1;
            var availableQty = recInvtotal - itemAllocTotal;
            var boFulfillQty = boItemListObj[itemId];
            if (boFulfillQty == undefined || boFulfillQty == 'undefined') {
                boFulfillQty = 0;
            }
            var qtyRemaining = recInvtotal - itemAllocTotal - boFulfillQty;

            itemName += '   ' + dispName;
            if (itemId == oldItemId)
            {
                itemName = '';
                recInvtotal = '';
                itemAllocTotal = '';
                availableQty = '';
                qtyRemaining = '';
                totalOrdFLQty += orderQty;
                totalOrdFLDisp = "";
                if (i == customerAllocList.length - 1 && j == itemAllocList.length - 1) {
                    htmlData = htmlData.replace(/totalOrdFLSign/gi, (totalOrdFLQty*1 + boFulfillQty*1));    
                } else {
                    boFulfillQty = '';
                }
            } else {
                htmlData = htmlData.replace(/totalOrdFLSign/gi, (totalOrdFLQty*1 + boFulfillQty*1));
                totalOrdFLDisp = 'totalOrdFLSign';
                totalOrdFLQty = orderQty;
            }

            htmlData += "<tr>";
            htmlData += "<td>" + itemId + "</td>";
            htmlData += "<td>" + itemName + "</td>";
            htmlData += "<td>" + recInvtotal + "</td>";
            htmlData += "<td>" + itemAllocTotal + "</td>";
            htmlData += "<td>" + totalOrdFLDisp + "</td>";
            htmlData += "<td>" + availableQty + "</td>";
            htmlData += "<td>" + boFulfillQty + "</td>";
            htmlData += "<td>" + qtyRemaining + "</td>";
            htmlData += "<td>" + departmentName + "</td>";
            htmlData += "<td>" + customerName + "</td>";
            htmlData += "<td>" + allocQty + "</td>";
            htmlData += "<td>" + orderQty + "</td>";
            htmlData += "<td>" + remainQty + "</td>";
            htmlData += "<td>" + fromDate + " 05:00:00 AM" + "</td>";
            htmlData += "<td>" + toDate + " 05:00:00 AM" + "</td>";
            htmlData += "</tr>";

            oldItemId = itemId;
        }
    }    
    htmlData += "</table>";
    htmlData += "</div>";

    return htmlData;
}

function setExportAll(form)
{
    var customerAllocList = getAllocDetailsAll();
    var htmlData = makeAllExcelHtml(customerAllocList);

    var excel_export_all_html = form.getField('excel_export_all_html');
    excel_export_all_html.setDefaultValue( htmlData );

    return form;
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
                itemObj.sttDate = element.getValue(cols[10]);
                itemObj.recInvtotal1 = element.getValue(cols[11]);
                itemObj.sttDate1 = element.getValue(cols[12]); 
                itemObj.beccaOrderQty = element.getValue(cols[13]);
                itemObj.toLegacyQty = element.getValue(cols[14]); 
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
                var orderQty = detailObj['orderQty'] * 1;

                var tmpArr = shipWindow.split(" ~ ");
                var tmpFromDate = '';
                var tmpToDate = '';
                if (tmpArr != undefined && tmpArr != 'undefined') {
                    if (tmpArr[0] != undefined && tmpArr[0] != 'undefined') {
                        tmpFromDate = tmpArr[0].split(' ')[1];          
                    }
                    if (tmpArr[1] != undefined && tmpArr[1] != 'undefined') {
                        tmpToDate = tmpArr[1].split(' ')[0];        
                    }
                }
                
                if (fromDate == tmpFromDate && toDate == tmpToDate)
                {
                    allocItemList[i].orderQty = orderQty;
          //          break;
                }
            }
        }
    }

    var allocItemList = groupSameCustomersAll(allocItemList);
    return allocItemList;
}

function getBackOrderFulfilledAll()
{
    var itemObj = new Object;
    var results = nlapiSearchRecord( 'transaction', 'customsearch566_2', null, null);
  
    if (results && results.length > 0)
    {   
        var cols = results[0].getAllColumns();
        for (var i = 0; i < results.length; i ++) {
            var element = results[i];
            var itemId = element.getValue(cols[0]);
            var totalQty = element.getValue(cols[1]);

            itemObj[itemId] = totalQty;
        }
    }

    return itemObj;
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
                
   //               dLog('oldItemId - ' + oldItemDepId, 'itemId - ' + itemId);
   //             dLog('depOrderTotalObj', JSON.stringify(depOrderTotalObj));
                
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
        }

        resultIndex = resultIndex + resultStep;
    } while (resultSet.length > 0);

    totalOrderObj.depOrderObj = depOrderTotalObj;
    totalOrderObj.cusOrderObj = cusOrderTotalObj;

  //  if (itemId == 12925 && departmentId == 32) {
 //           dLog('depOrderTotalObj', JSON.stringify(depOrderTotalObj));
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

/*============================================ Log =========================================*/
function dLog(title, details)
{
    nlapiLogExecution('Debug', title, details);
}