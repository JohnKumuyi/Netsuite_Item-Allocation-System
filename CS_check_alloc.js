$ = jQuery;
$(document).ready(function()
{
    $('#item_splits').unbind('click').bind("click", function (event) {
        $('.uir-machine-row').unbind('click').bind("click", function (event) {
            var rowObj = $(this);
            disableLineField(rowObj);
        });
    });
    $('#closeremaining').unbind('click').bind("click", function (event) {
        setTimeout(postSO,  100);
        return true;
    });
    $('#btn_multibutton_submitter').unbind('click').bind("click", function (event) {
        setTimeout(validateSO,  100);
        return false;
    });
});

function postSO()
{
    var recId = nlapiGetRecordId();
    var soRec = nlapiLoadRecord('salesorder', recId); 
    nlapiSubmitRecord(soRec, false, true);
}

function validateSO()
{
    var recId = nlapiGetRecordId();
    if (recId) {
        var url = "https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=156&deploy=1";
        var param = {recId: recId, isSOEditAndSave: 'T'};
        $.post(url, param, function(data){
            if (data != '1') {
                alert(data);
            }
        });        
    }
}

function LineInit(type)
{
    if(type == 'item')
    {
        $('.uir-machine-row').unbind('click').bind("click", function (event) {
           var rowObj = $(this);
           disableLineField(rowObj); 
        });
    }
}

function disableLineField(rowObj)
{
   var context = nlapiGetContext();
   var userEmail = context.getEmail();
   var rowId = rowObj.attr('id')
   if (rowId != undefined && rowId != 'undefined') {
       var lineIndex = rowId.replace(/item_row_/gi, "") * 1;
       var IsAllocated = nlapiGetLineItemValue('item', 'custcol_enable_alloc', lineIndex);
       var qty = nlapiGetLineItemValue('item', 'quantity', lineIndex) * 1;
       var boSystemQty = nlapiGetLineItemValue('item', 'quantitybackordered', lineIndex) * 1;
       var boQty = nlapiGetLineItemValue('item', 'custcol_alloc_backorder_qty', lineIndex) * 1;
       
       if (IsAllocated == 'F' || qty < 1 || boSystemQty < 1) {
          $("#"+rowId).children('td').eq(2).html(''); 
       }
       if (!boQty) {
          $("#"+rowId).children('td').eq(9).html('');
          $("#"+rowId).children('td').eq(10).html('');
       }

       if (userEmail != 'kjzapps@gmail.com' && userEmail != 'wsong@beccacosmetics.com' && userEmail != 'scordone@beccacosmetics.com' && userEmail != 'tcarter@beccacosmetics.com') {
           $("#"+rowId).children('td').eq(1).html(''); 
       }
    } else {
          rowObj.children('td').eq(2).html(''); 
          rowObj.children('td').eq(9).html(''); 
          rowObj.children('td').eq(10).html(''); 
          if (userEmail != 'kjzapps@gmail.com' && userEmail != 'wsong@beccacosmetics.com' && userEmail != 'scordone@beccacosmetics.com' && userEmail != 'tcarter@beccacosmetics.com') {
              rowObj.children('td').eq(1).html(''); 
          }
    }
}

function allBackOrderApproved()
{
    var recId = nlapiGetRecordId();
    alert(recId);
    var url = "https://system.na1.netsuite.com/app/site/hosting/scriptlet.nl?script=156&deploy=1";
    var param = {recId: recId};
    $.post(url, param, function(data){
          if (data == '1') {
              location.reload();
          } else {
              alert(data);
              location.reload();
          }
    });
}