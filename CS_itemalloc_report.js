$ = jQuery;
$('.uir-onoff').eq(0).css('margin-top', '32px');
for (var i = 1; i < $('.uir-onoff').length; i ++) 
{
    $('.uir-onoff').eq(i).css('margin-top', '25px');
}

$(document).ready(function () {
  
  $("#alloc_item_fs_lbl_uir_label").parent().parent().parent().parent().parent().parent().hide();  
  
  var searchInputObj = $('#alloc_item_txt');
  searchInputObj.each(function () {
    var $t = $(this),
    default_value = this.value;
    $t.css('color', 'rgb(62, 61, 61)');
    $t.css('font-size', '10pt');
    $t.focus(function () {
        if (this.value == default_value) {
            this.value = '';
            $t.css('color', 'black');
            $t.css('font-size', '10pt');
        }
    });
    $t.blur(function () {
        if ($.trim(this.value) == '') {
            $t.css('color', 'rgb(62, 61, 61)');
            $t.css('font-size', '10pt');
            this.value = default_value;
        }
    });
  });
  
  $.ajax({
    context: this,
    contentType: "application/json; charset=utf-8",
    url: "/app/site/hosting/scriptlet.nl?script=149&deploy=1",
    success: function (response) {
      if (response) {
        var json_data = JSON.parse(response);

        var itemLength = 0;
        var limitLength = 8;
        searchInputObj.autocomplete({
          source: function (request, response) {
              var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
              var results = $.grep(json_data, function (value) {
              console.log($("#inpt_item_arrow").attr('arrow_clicked'));
            
              if ($("#inpt_item_arrow").attr('arrow_clicked') == 'T') {
                  return true;
              }
            
              var name = value.label;
              var alterName = name.replace(/[- ]/gi, "");
              if (matcher.test(name) || matcher.test(alterName))
                return true;

              var request_term = request.term;
              var strSrchNameArr = request_term.split(" ");
              var strItemNameArr = name.split(" ");
              var sameCount = 0;
              for (var i = strSrchNameArr.length - 1; i >= 0; i--) {
                var strSrchPiece = strSrchNameArr[i];
                if (strSrchPiece == "") {
                  strSrchNameArr.splice(i, 1);
                  continue;
                }
                var piece_matcher = new RegExp($.ui.autocomplete.escapeRegex(strSrchPiece), "i");
                for (var j = strItemNameArr.length - 1; j >= 0; j--) {
                  if (piece_matcher.test(strItemNameArr[j])) {
                    strItemNameArr.splice(j, 1);
                    sameCount++;
                    break;
                  }
                }
              }
              if (sameCount == strSrchNameArr.length) return true;
            });
            itemLength = results.length;
            
            if (results.length == 0) { 
                results.push({"label": 'No results',"internalId": 0});
            }
            $("#inpt_item_arrow").attr('arrow_clicked', 'F');
           
            response(results);
          },
          minLength: 1,
        select: function (event, ui) {
            $(this).val(ui.item.label).blur();
            searchItem(ui.item.label, ui.item.internalId);
            return false;
        }
        }).autocomplete("instance")._renderItem = function (ul, item) {
          var itemIndex = $("#ui-id-1 > li").length;
          var inner_html = '<li class="ui-menu-item"><div class="ui-menu-item-wrapper" tabindex="-1" style="margin-bottom: 4px; padding:0px; display : flex; align-items : center;"><span style="margin-left: 10px; font-size: 10pt">' + item.label + '</span></div></li>';
          $("#ui-id-1").css('max-height', '300px');
          $("#ui-id-1").css('overflow-y', 'auto');
          return $(inner_html).appendTo(ul);
        }

      }
    }
  });

  $(window).resize(function () {
    $("#alloc_item_txt").autocomplete("search");
  });

  function searchItem(itemName, itemId) {
    if (itemId * 1 > 0) {
        nlapiSetFieldValue('alloc_item', itemId);
    }
  }

  $("#item_link_wrapper").hover(function () {
    $("#item_popup_link").attr('style', 'visibility:visible !important');
  }, function () {
    $("#item_popup_link").attr('style', 'visibility:hidden !important');
  });

  $("#item_popup_link").unbind('click').bind('click', function () {

    var itemId = nlapiGetFieldValue('alloc_item') * 1;
    if (itemId) {
      nlOpenWindow('/app/common/item/item.nl?id=' + itemId + '', '_blank', '');
    } else {
      alert('Please choose an entry first.');
    }
  });
  
  $("#inpt_item_arrow").unbind('click').bind('click', function () {
    $(this).attr('arrow_clicked', 'T');
    $('#alloc_item_txt').keydown();
  });
  
  $("#alloc_item_txt").keydown(function(event){ 
    console.log("Key: " + event.which);
    
    if (event.which == '13') {
  //     nlapiSetFieldValue('alloc_item', 0);
       return false;
    }
  });
  
});

function PageInit()
{   
    var totalCount = nlapiGetFieldValue('total_count') * 1;
    var naCount = nlapiGetFieldValue('na_count') * 1;
    var intlCount = nlapiGetFieldValue('intl_count') * 1;
    
    if (intlCount > 0) {
        var startIndex = naCount;
        $('.uir-onoff').eq(startIndex).css('margin-top', '32px');
    }

    $("#inv_alloc_total_fs_lbl_uir_label").css('width', '250px');
    $("#total_order_fulfill_fs_lbl_uir_label").css('width', '250px');
    $("#qty_remaining_all_fs_lbl_uir_label").parent().css('width', '300px');
    $("#stt_date_1_fs_lbl_uir_label").parent().css('margin-top', '38px');
    $("#total_allocated_1_fs_lbl_uir_label").parent().css('margin-top', '9px');
    $("#qty_available_1_fs_lbl_uir_label").parent().css('margin-top', '9px');
    $("#total_order_fulfill_1_fs_lbl_uir_label").parent().css('margin-top', '9px');
    $("#qty_remaining_all_1_fs_lbl_uir_label").parent().css('margin-top', '9px');
  
    if (totalCount > 0 && nlapiGetFieldValue('display_mode') == 'inline') {
        $("#department_1_lbl_uir_label").parent().css('width', '300px');
        $("#remain_qty_1_fs_lbl").parent().css('width', '300px');
    }
    
 //     $("#total_order_fulfill_fs_lbl").children('a').html('TOTAL ORDERED +<BR>BACKORDER FULFILLED');
 //     $("#total_order_fulfill_fs_lbl").parent().parent().css('margin-top', '-8px');
    
    var itemId = nlapiGetFieldValue('alloc_item')*1;
    var itemName = nlapiGetFieldText('alloc_item');
    var displayMode = nlapiGetFieldValue('display_mode');
    if (itemId)
    {
        $('#alloc_item_txt').val(itemName);
        var action = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1&itemId='+itemId+'&display_mode='+displayMode;
        changeUrl('', action);
      
        var rowCount = nlapiGetFieldValue('total_count') * 1;
        if (rowCount > 0 && displayMode == 'inline') {
            $("#customer_1_lbl_uir_label").parent().css('width', '300px');
        }
    }
}

function FieldChanged(type, name)
{
    if(name == 'alloc_item')
    { 
        window.ischanged = false;
        var itemId = nlapiGetFieldValue('alloc_item')*1;
        var displayMode = nlapiGetFieldValue('display_mode');
        if (itemId)
        {
            var param = '&submit_type=ItemChanged';
            param += '&itemId='+ itemId;
            param += '&display_mode='+ displayMode;
            window.location.href = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1' + param;         
        }
    } else if (name.indexOf('department_') > -1){
       if (nlapiGetFieldText(name) == 'Becca.com'){
           var index = name.split('_')[1];
           var fieldId = "total_order_" + index;
           var field = nlapiGetField(fieldId);
           field.setDisplayType('normal');
       }
    }
}

function SaveRecord()
{
    var status = $('.main_customer').eq(0).attr('status');
    if (status != undefined && status != 'undefined')
    {
        if(status == 1)
        {
           var strErrMsg = validateEntity();
           if (strErrMsg == undefined || strErrMsg == 'undefined') {
               nlapiSetFieldValue('submit_type', 'ItemSaved');
               return true;   
           } else {
               alert(strErrMsg);       
           }
        }
        else
        {
            alert("It can't be saved when it is collpased!");
        }
    }
    else
    {
        alert('There is no data to be saved!');
    }
}

function validateEntity()
{
    var total_count = nlapiGetFieldValue('total_count') * 1;
    for (var i = 0; i < total_count; i ++)
    {
        var index = i + 1;
        var department = nlapiGetFieldValue('department_' + index) * 1;
        var customer = nlapiGetFieldValue('customer_' + index) * 1;
        
        console.log(index + ' : ' + department + " - " + customer);
        if (department && customer) {
            var strErrMsg = "You can't input both Department and Customer on the same line " + index;
            return strErrMsg;
        } else if (!department && !customer) {
            var strErrMsg = "You should select any Department and Customer " + index;
            return strErrMsg;
        }

        var allocQty = nlapiGetFieldValue('allocated_total_' + index);
        var totalOrder = nlapiGetFieldValue('total_order_' + index);
        var remainQty = nlapiGetFieldValue('remain_qty_' + index);
        var fromDate = nlapiGetFieldValue('from_date_' + index);
        var toDate = nlapiGetFieldValue('to_date_' + index);

        if (isEmpty(allocQty)) {
            var strErrMsg = "Please enter value(s) for: Allocated Qty - Line : " + index;
            return strErrMsg;
        }
        if (isEmpty(totalOrder)) {
            var strErrMsg = "Please enter value(s) for: Total Order - Line : " + index;
            return strErrMsg;
        }
        if (isEmpty(fromDate)) {
            var strErrMsg = "Please enter value(s) for: From Date - Line : " + index;
            return strErrMsg;
        }
        if (isEmpty(toDate)) {
            var strErrMsg = "Please enter value(s) for: To Date - Line : " + index;
            return strErrMsg;
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

function changeUrl(title, url)
{
    if (typeof (history.pushState) != "undefined") {
        var obj = { Title: title, Url: url };
        history.pushState(obj, obj.Title, obj.Url);
    } else {
        alert("Browser does not support HTML5.");
    }
}

function s2ab(s)
{
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}

function excelExport()
{   
    var count = nlapiGetFieldValue('total_count') * 1;
    if(count == 0){
        alert('Please select item');
        return;
    }
    var file_name_suffix = nlapiGetFieldText('alloc_item');
    var today = new Date();
    var year = "" + today.getFullYear();
    var month = "" + (today.getMonth() * 1 + 1);
    var day = "" + today.getDate();
    var hours = "" + today.getHours();
    var minutes = "" + today.getMinutes();
    var seconds = "" + today.getSeconds();
  
    if (month.length == 1) {
        month = '0' + month;
    }
    if (day.length == 1) {
        day = '0' + day;
    }
    if (hours.length == 1) {
        hours = '0' + hours;
    }
    if (minutes.length == 1) {
        minutes = '0' + minutes;
    }
    if (seconds.length == 1) {
        seconds = '0' + seconds;
    }
  
    var tag = month + day + year.substr(2, 2) + "_" + hours + minutes + seconds;
    var wb = XLSX.utils.table_to_book(document.getElementById('tbl_obj'), {sheet:"Sheet1"});
    var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
    saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'Item Allocation Report_' + file_name_suffix + "_" + tag + '.xlsx');  
}

function excelExportAll()
{
    var today = new Date();
    var year = "" + today.getFullYear();
    var month = "" + (today.getMonth() * 1 + 1);
    var day = "" + today.getDate();
    var hours = "" + today.getHours();
    var minutes = "" + today.getMinutes();
    var seconds = "" + today.getSeconds();
  
    if (month.length == 1) {
        month = '0' + month;
    }
    if (day.length == 1) {
        day = '0' + day;
    }
    if (hours.length == 1) {
        hours = '0' + hours;
    }
    if (minutes.length == 1) {
        minutes = '0' + minutes;
    }
    if (seconds.length == 1) {
        seconds = '0' + seconds;
    }
  
    var tag = month + day + year.substr(2, 2) + "_" + hours + minutes + seconds;
   
    var wb = XLSX.utils.table_to_book(document.getElementById('tbl_obj_all'), {sheet:"Sheet1"});
    var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
    saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), 'Item Allocation Report All_' + tag + '.xlsx');  
}

function excelImport()
{
    window.ischanged = false;
    window.location.href = 'https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=145&deploy=1';
}

function editPage()
{
    var itemId = nlapiGetFieldValue('alloc_item')*1;
    if(itemId)
    {   
        window.ischanged = false;
        var param = '&submit_type=Edit';
        param += '&itemId='+ itemId;
        window.location.href = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1' + param;
    }
}

function refreshAll()
{
    var itemId = nlapiGetFieldValue('alloc_item')*1;
    var displayMode = nlapiGetFieldValue('display_mode');
    if(itemId)
    {
        window.ischanged = false;
        var param = '&submit_type=Refresh';
        param += '&display_mode='+ displayMode;
        param += '&itemId='+ itemId;
        
        window.location.href = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1' + param;
    } else {
        alert('Please select item!');
    }
}

function addNewCustomer()
{
    var itemId = nlapiGetFieldValue('alloc_item') * 1;
    if(itemId)
    {
        window.ischanged = false;
        var action = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1';
        var postParam = {'submit_type': 'NewCustomer', 'itemId': itemId};
        $.post(action, postParam, function(result){
            if(result){
                  var loadParam = '&submit_type=NewCustomer';
                  loadParam += '&itemId='+ itemId;
                  window.location.href = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1' + loadParam;
            }
        });
    } else {
        alert('Please select item !');
    }
}

function deleteCustomer()
{
    var count = nlapiGetFieldValue('total_count') * 1;
    if(count > 0)
    {
        var Checked = false;
        for (var i = 0; i < count; i ++)
        {
            var chkVal = nlapiGetFieldValue('del_check_' + (i + 1));
            if (chkVal == 'T') {
                Checked = true;
                break;
            }
        }
        if (Checked)
        {   
            if (confirm("Are you sure you want delete checked records?")){
                window.ischanged = false;
                var itemId = nlapiGetFieldValue('alloc_item')*1;
                var postParam = new Object;
                postParam['submit_type'] = 'DelCustomer';
                postParam['itemId'] = itemId;
                postParam['total_count'] = nlapiGetFieldValue('total_count') * 1;
                for (var i = 0; i < count; i ++)
                {
                    var index = i + 1;
                    postParam['alloc_rec_' + index] = nlapiGetFieldValue('alloc_rec_' + index);
                    postParam['range_rec_' + index] = nlapiGetFieldValue('range_rec_' + index);
                    postParam['customer_' + index] = nlapiGetFieldValue('customer_' + index);
                    postParam['allocated_total_' + index] = nlapiGetFieldValue('allocated_total_' + index);
                    postParam['from_date_' + index] = nlapiGetFieldValue('from_date_' + index);
                    postParam['to_date_' + index] = nlapiGetFieldValue('to_date_' + index);
                    postParam['del_check_' + index] = nlapiGetFieldValue('del_check_' + index);
                }
             
                var action = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1';
                $.post(action, postParam, function(result){
                    if (result == '1'){
                        var loadParam = '&submit_type=DelCustomer';
                        loadParam += '&itemId='+ itemId;
                        window.location.href = 'https://system.netsuite.com/app/site/hosting/scriptlet.nl?script=144&deploy=1' + loadParam;
                    } else {
                        alert(result);
                    }
                });
            }
        }
        else
        {
            alert('There is nothing to be deleted!');   
        }
    }
    else
    {
        alert('There is nothing to be deleted!');  
    }
    
}

var fieldList = ['customer_', 'allocated_total_', 'total_order_', 'remain_qty_', 'from_date_', 'to_date_', 'del_check_', 'customer_list_', 'department_'];
function expandAndCollapseAll()
{   
    var len = $('.main_customer').length;
    var displayMode = nlapiGetFieldValue('display_mode');
    for (var i = 0; i < len; i ++)
    {   
        var mainCustomerObj = $('.main_customer').eq(i);
        var customerId = mainCustomerObj.attr('customerId');
        var count = mainCustomerObj.attr('sameCustomerCount');
        if (count == 1) continue;
       
        if(mainCustomerObj.attr('status') == 1)
        {
           toggleChild(customerId, count);  
           mainCustomerObj.attr('status', '0');
           
           if (displayMode != 'inline'){
               var fromDateFld = nlapiGetField("from_date_" + customerId);
               fromDateFld.setDisplayType('disabled');
               var toDateFld = nlapiGetField("to_date_" + customerId);
               toDateFld.setDisplayType('disabled');
               var chkObj = nlapiGetField('del_check_' + customerId);
               chkObj.setDisplayType('disabled');
           }
           
          
           sumUp(customerId, count);    
        }
        else
        {
           mainCustomerObj.attr('status', '1');
           var fromDateFld = nlapiGetField("from_date_" + customerId);
           fromDateFld.setDisplayType('normal');
           var toDateFld = nlapiGetField("to_date_" + customerId);
           toDateFld.setDisplayType('normal');
           var chkObj = nlapiGetField('del_check_' + customerId);
           if (displayMode != 'inline'){
               chkObj.setDisplayType('normal');
           }
          
           var allocQty = mainCustomerObj.attr('allocQty');
           var mainId = fieldList[1] + customerId;
           nlapiSetFieldValue(mainId, allocQty);
           var fldObj = nlapiGetField(mainId);
           if (displayMode != 'inline'){ 
               fldObj.setDisplayType('normal');
           }
                    
           var orderQty = mainCustomerObj.attr('orderQty');
           mainId = fieldList[2] + customerId;
           nlapiSetFieldValue(mainId, orderQty);
            
           var remainQty = mainCustomerObj.attr('remainQty');
           mainId = fieldList[3] + customerId;
           nlapiSetFieldValue(mainId, remainQty);
                               
           toggleChild(customerId, count);
        }
    }
}

function toggleChild(customerId, count)
{
    var displayMode = nlapiGetFieldValue('display_mode');
    for (var i = 1; i < count; i ++)
    {
        for (var k = 0; k < fieldList.length; k ++)
        {
            var rowNum = customerId * 1 + i;
            var id_suffix = "_fs_lbl_uir_label";
            if ((k == 0 || k == 8) && displayMode=='inline') {
                id_suffix = "_lbl_uir_label";
            }
            var id = fieldList[k] + rowNum + id_suffix;
            $("#" + id).parent().slideToggle(300);
        }
    }
}

function sumUp(customerId, count)
{
    for (var k = 1; k <= 3; k ++)
    {   
        var totalVal = 0;
        for (var i = 1; i < count; i ++)
        {
            var rowNum = customerId * 1 + i;
            var id = fieldList[k] + rowNum;
            var fldVal = nlapiGetFieldValue(id) * 1;
            totalVal += fldVal;
        }
        var mainId = fieldList[k] + customerId;
        var fldVal = nlapiGetFieldValue(mainId) * 1;
        totalVal += fldVal;
        nlapiSetFieldValue(mainId, totalVal);
        var fldObj = nlapiGetField(mainId);
        fldObj.setDisplayType('disabled');
    }
}

function dLog(title, details)
{
    nlapiLogExecution('Debug', title, details);
}