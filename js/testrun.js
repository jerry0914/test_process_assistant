//可在Javascript中使用如同C#中的string.format
//使用方式 : var fullName = String.format('Hello. My name is {0} {1}.', 'FirstName', 'LastName');
String.format = function ()
{
    var s = arguments[0];
    if (s == null) return "";
    for (var i = 0; i < arguments.length - 1; i++)
    {
        var reg = getStringFormatPlaceHolderRegEx(i);
        s = s.replace(reg, (arguments[i + 1] == null ? "" : arguments[i + 1]));
    }
    return cleanStringFormatResult(s);
}
//可在Javascript中使用如同C#中的string.format (對jQuery String的擴充方法)
//使用方式 : var fullName = 'Hello. My name is {0} {1}.'.format('FirstName', 'LastName');
String.prototype.format = function ()
{
    var txt = this.toString();
    for (var i = 0; i < arguments.length; i++)
    {
        var exp = getStringFormatPlaceHolderRegEx(i);
        txt = txt.replace(exp, (arguments[i] == null ? "" : arguments[i]));
    }
    return cleanStringFormatResult(txt);
}
//讓輸入的字串可以包含{}
function getStringFormatPlaceHolderRegEx(placeHolderIndex)
{
    return new RegExp('({)?\\{' + placeHolderIndex + '\\}(?!})', 'gm')
}
//當format格式有多餘的position時，就不會將多餘的position輸出
//ex:
// var fullName = 'Hello. My name is {0} {1} {2}.'.format('firstName', 'lastName');
// 輸出的 fullName 為 'firstName lastName', 而不會是 'firstName lastName {2}'
function cleanStringFormatResult(txt)
{
    if (txt == null) return "";
    return txt.replace(getStringFormatPlaceHolderRegEx("\\d+"), "");
}

function __set_text_to_clipboard(text){
	$('body').append('<textarea id="copy_to_clipboard"></textarea>');
	$("#copy_to_clipboard").val(text);
	// $("#copy_to_clipboard").focus();
	$("#copy_to_clipboard").select();
	try {
		var successful = document.execCommand('copy');
		var msg = successful ? 'successful' : 'unsuccessful';
		console.log('Copying text command was ' + msg);
	} 
	catch (err) {
		console.log('Oops, unable to copy');
	}
	$("#copy_to_clipboard").remove();
}

function get_all_tc_id_title(){	
	$.ajax({
		url: 'php/testrun.php',
		type: 'POST',
		dataType: 'json',
		data: {
				"action":"get_tr_tc_list"
		},
		success:function(response) {
			if(response.result=="Pass"){
				$("#data_trid").val(response.trid); //Store selected TestrunID
				$("#txt_tr_name").html(response.tr_name); // Show current testrun name
				//console.log("Current Testrun Name="+response.tr_name);
				var option_html=''
				for (index in response.testcases){
					id=response.testcases[index].ID;
					title=response.testcases[index].Title;
					verdict=response.testcases[index].Verdict;
					automated=response.testcases[index].Automated;
					note=response.testcases[index].Note;
					option_html+="<option value="+id;
					if(verdict && verdict.toLowerCase()!="null"){
						option_html+=" verdict=\""+verdict+"\"";
					}
					if(automated && automated.toLowerCase()!="null"){
						option_html+=" automated=\""+automated+"\"";
					}
					if(note && note.toLowerCase()!="null"){
						option_html+=" has_note";
					}	
					option_html+=">"+id+" ; "+title+"</option>"
				}
				$("#tr_tc_list").html(option_html);
				if($('#tr_tc_list').children('option').length>0){
					selected_tc_change();
					$("#btn_previous_tc").attr('disabled','');
				}
				refresh_progress_table();
			}
		},
	});
}

function refresh_progress_table(){
	$total_tcs=$("#tr_tc_list").children("option").length;
	$done_tcs=$("#tr_tc_list").children("option[verdict]").length;
	$passed_tcs=$("#tr_tc_list").children("option[verdict=Passed]").length;
	$failed_tcs=$("#tr_tc_list").children("option[verdict=Failed]").length;
	$blocked_tcs=$("#tr_tc_list").children("option[verdict=Blocked]").length;
	$exemption_tcs=$("#tr_tc_list").children("option[verdict=Exempted]").length;
	$indeterminate_tcs=$("#tr_tc_list").children("option[verdict=Indeterminate]").length;
	$("#cur_prog_total").html($done_tcs+"/"+$total_tcs);
	$("#cur_prog_p").html($passed_tcs);
	$("#cur_prog_f").html($failed_tcs);
	$("#cur_prog_b").html($blocked_tcs);
	$("#cur_prog_e").html($exemption_tcs);
	$("#cur_prog_i").html($indeterminate_tcs);
}

function clear_up_tc_info(){
	$("#current_tc_verdict").html("---");
	$("#current_tc_comment").html("");
	$("#current_tc_tester").html("");
	$("#current_tc_verdict").attr("verdict",null);
	$("#current_tc_comment").attr("verdict",null);
	$("#table_tr_history_results").find("tr:not(:first)").remove();
	//clear tc_hints
	$("#hint_message").val("");
	$("#hint_edit_message").val("");
	$("#hint_wiki_link").attr("href","#");
	$("#hint_updater").html("");
	$("#hint_updated_time").html("");

	$("#btn_attachment").attr("hidden","true");
	$("#btn_attachment").attr("href","#");
	hint_panel_switch_editable_mode(false);

	clear_notification_icon();
	failed_detail_editable(false);
	failed_details_clear_up();
	testresult_failed_details_clear_up();
}

function present_current_tc_verdict(verdicts_ary){
	if(verdicts_ary && verdicts_ary.length>0){
		var last_verdict = verdicts_ary[0];
		//************** Update current verdict indicator **************
		$("#current_tc_verdict").html(last_verdict.text.toUpperCase().substring(0,1));
		$("#current_tc_verdict").attr("verdict",last_verdict.text);
		if(last_verdict.comment && last_verdict.comment.length>0){
			$("#current_tc_comment").html('  '+htmlEncode(last_verdict.comment));
			$("#current_tc_comment").attr("verdict",last_verdict.text);

			var tester = last_verdict.tester_f_name+"_"+last_verdict.tester_l_name.substring(0,1);
			$("#current_tc_tester").html('['+tester+']');
			if(last_verdict.failed_details){
				present_failed_jira_hyperlink(null);
				failed_details_modal_enable(true);
				present_failed_details($("#txt_tc_id").text(),last_verdict.updated_time,last_verdict.comment,last_verdict.failed_details,last_verdict.tester);
			}
			else{
				present_failed_jira_hyperlink(last_verdict.jira_hyperlink);
				$("#current_tc_comment").removeAttr('href');
				failed_details_modal_enable(false);
			}
		}
		if(last_verdict.attachment && last_verdict.attachment.length>0){
			$("#btn_attachment").removeAttr("hidden");
			$("#btn_attachment").attr("href",last_verdict.attachment);
			$("#btn_attachment").attr("Title","Click to copy :\n"+last_verdict.attachment);
		}
		//************** update history_result_modal ***************
		$("#current_tc_verdict").attr("data-toggle","modal");
		$("#current_tc_verdict").attr("data-target","#history_results_modal");
		$("#table_tr_history_results").find("tr:not(:first)").remove();
		$.each(verdicts_ary,function(index,verdict){
			var tr="<tr>";
			tr+="<td>"+verdict.text+"</td>";
			tr+="<td>"+verdict.tester_f_name+"_"+verdict.tester_l_name+"</td>";
			tr+="<td>"+verdict.updated_time+"</td>";
			tr+="<td>"+htmlEncode(verdict.comment)+"</td>";
			tr+="</tr>";
			$("#table_tr_history_results").append(tr);
		}); 
	}
}

function get_testcase_info (){
	//console.log('input value='+tcid);
	var tcid = $('#tr_tc_list').val();
	var trid = $('#data_trid').val();
	$("#txt_test_procedure").text("");
	$("#txt_expected_result").text("");
	$.ajax({
        url:'php/testrun.php',
        type:'POST',
        dataType:'json',
        data: {
        "action":'get_testcase_info',
    		"tcid":tcid,
    		"trid":trid
    	},
        success: function(response) {
        	clear_up_tc_info();
        	$("#txt_tc_id").text(response.tcinfo.ID);
        	$("#txt_tc_id").attr("href","https://polarion.zebra.com/polarion/#/project/STTL/workitem?id="+response.tcinfo.ID);
        	$("#txt_tc_title").html(response.tcinfo.Title);
			$("#txt_test_procedure").html(htmlEncode(response.tcinfo.Procedure));
			$("#txt_expected_result").html(htmlEncode(response.tcinfo.ExpectedResult));
			$("#txt_legacy_id").html("");
			if(response.tcinfo.Legacy_ID && response.tcinfo.Legacy_ID.length>0){
				$("#txt_legacy_id").html("("+htmlEncode(response.tcinfo.Legacy_ID)+")");
			}
			if(response.tcinfo.Automated!=null){
				if(response.tcinfo.Automated.toUpperCase()=="A"){
					add_notification_icon("AUTOMATED");
				}
				else if(response.tcinfo.Automated.toUpperCase()=="S"){
					add_notification_icon("SEMI-AUTO");
				}
			}
			if(response.tcinfo.Note){
				sticky_note_set_value(response.tcinfo.Note);
			}
			if(response.tcinfo.Tags){				
				for (index in response.tcinfo.Tags){
					var this_tag = response.tcinfo.Tags[index];
					add_notification_icon(this_tag.Key,this_tag.Description,this_tag.Value);					
				}
			}
			if(response.tcinfo.Hints && response.tcinfo.Hints.length>0){
				if(response.tcinfo.Hints[0]){
					$("#hint_message").val(response.tcinfo.Hints[0].Message);
					$("#hint_updated_time").html(response.tcinfo.Hints[0].UpdatedTime);
					$("#hint_updater").html(response.tcinfo.Hints[0].Updater);
				}
				change_hint_icon(true);
			}
			else{
				change_hint_icon(false);
			}
			if(response.tcinfo.Document && response.tcinfo.Document.length>0){
				$("#txt_tc_id").attr("title",response.tcinfo.Document);
			}
			else{
				$("#txt_tc_id").attr("title",null);
			}
			get_st_wiki_link();
			present_current_tc_verdict(response.tcinfo.Verdicts);
			set_shift_for_top_panel();
        }
    });
}

function htmlEncode(value){
  //create a in-memory div, set it's inner text(which jQuery automatically encodes)
  //then grab the encoded contents back out.  The div never exists on the page.
  var html_str= $('<div/>').text(value).html();
  html_str=html_str.replace(/\r/g,"").replace(/(_x\w{1,4}_)/g,"").replace(/\n/g,"<br />");
  return html_str;
}

function htmlDecode(value){
  return $('<div/>').html(value).text();
}

function add_notification_icon(key,description="",value=null){

	if(description.length==0){
		description=key;
	}
	//console.log("add_notification_icon, key="+key+", description="+description+", value="+(value?value:""));
	var html_str="<i name=\"notifications\" class=\"btn\" data-toggle=\"tooltip\" data-placement=\"right\" title=\""+description+"\" ";
	var matched=false;
	if(key=="AUTOMATED"){
		html_str+="style=\"background-image:url('image/automation.png')\"";
		matched = true;
	}
	else if(key=="SEMI-AUTO"){
		html_str+="style=\"background-image:url('image/semi-auto.png')\"";		
		matched = true;
	}
	else if(key=="LONG TIME"){
		html_str+="style=\"background-image:url('image/longtime.png')\"";		
		matched = true;
	}
	else if(key=="BATTERY"){
		var battery_html="style=\"background-image:url('image/battery.png')\"";		
		if(value){
			if(parseInt(value)<0){
				battery_html="style=\"background-image:url('image/battery_D.png')\"";
			}
			else if(parseInt(value)==0){
				battery_html="style=\"background-image:url('image/battery_E.png')\"";
			}
			else if(parseInt(value)<20){
				battery_html="style=\"background-image:url('image/battery_L.png')\"";
			}
			else if(parseInt(value)==100){
				battery_html="style=\"background-image:url('image/battery_F.png')\"";
			}
		}		
		matched = true;
		html_str+=battery_html;
	}
	else if(key=="FACTORY RESET"){
		html_str+="style=\"background-image:url('image/reset_F.png')\"";		
		matched = true;
	}
	else if(key=="ENTERPRISE RESET"){
		html_str+="style=\"background-image:url('image/reset_E.png')\"";		
		matched = true;
	}
	else if(key=="OS UPDATE"){
		html_str+="style=\"background-image:url('image/os_update.png')\"";		
		matched = true;
	}
	else if(key=="HEADSET"){
		html_str+="style=\"background-image:url('image/headset.png')\"";		
		matched = true;
	}
	else if(key=="BT HEADSET"){
		html_str+="style=\"background-image:url('image/bt_headset.png')\"";		
		matched = true;
	}
	if(matched){
		html_str+="></i>";
		$("#tc_icons_panel").append(html_str);		
	}
	//console.log(html_str);
}

function clear_notification_icon(){
	$("#tc_icons_panel i[name=notifications]").remove();
}

function selected_tc_change(){
	var el_tr_tc_list = document.getElementById("tr_tc_list");
	var btn_next = document.getElementById("btn_next_tc");
	var btn_previous = document.getElementById("btn_previous_tc");
	var el_tr_tc_index = document.getElementById("tr_tc_index");
	var list_length = el_tr_tc_list.length;
	$("#current_tc_verdict").attr("data-toggle",null);//disable history result modal by defaul
	$("#current_tc_verdict").attr("data-target",null);//disable history result modal by default

	if(list_length>0){
		var selectedIndex = el_tr_tc_list.selectedIndex;
		btn_previous_tc.disabled=selectedIndex==0;
		btn_next_tc.disabled=selectedIndex>=(list_length-1);
		tr_tc_index.innerHTML =(selectedIndex+1)+"/"+el_tr_tc_list.length;
		sticky_note_set_value("");
		get_testcase_info();
	}
	else{
		btn_next.disabled = true;
		btn_previous_tc.disabled = true;
		tr_tc_index.innerHTML = "--/---";
	}	
}

// function __get_current_test_result(){
// 	var tcid = $('#tr_tc_list').val();
// 	var trid = $('#data_trid').val();
// 	$.ajax({
//         url:'php/testrun.php',
//         type:'POST',
//         dataType:'json',
//         data: {
//         "action":'get_current_test_result',
//     		"tcid":tcid,
//     		"trid":trid
//     	},
//         success: function(response) {
// 			if(response.result="Pass"){
// 				if(response.testing_result){
// 					alert('['+response.testing_result.verdict+"]"+": "+response.testing_result.comment);
// 				}
// 				else{
// 					alert("No testing result!");
// 				}				
// 			}
// 			else{
// 				if (response.message){
// 					alert(response.message);
// 				}
// 			}
//         }
//     });
// }

function verdict_btn_clicked(result){	
	$("#btn_submit_testresult").attr("disabled","true"); //disable submit button by default.
	$("#txt_testcase_verdict").html(result);
	$("#txt_testcase_verdict").attr("verdict",result);
	$("#form_failed_details").attr("hidden","");
	$("#btn_test_result_issue_mode").attr("hidden","");
	if(result=="Passed"){
		$("#btn_submit_testresult").attr("disabled",null);
	}
	if(result=="Failed"){
		$("#txt_tr_comment").attr("rows",1);
		//New issue mode (JIRA) by default
		switch_test_result_new_issue();		
	}
	else{		
		$("#lebel_tr_main").text("Comment:");
		$("#txt_tr_comment").attr("rows",6);
		$('#form_jira_hyper_link').attr("hidden","");
	}
}

function next_tc(){
	var el_tr_tc_list = document.getElementById("tr_tc_list");
	if(el_tr_tc_list.selectedIndex<(el_tr_tc_list.length-1)){
		el_tr_tc_list.selectedIndex = el_tr_tc_list.selectedIndex+1;
		selected_tc_change();
	}
}

function previous_tc(){
	var el_tr_tc_list = document.getElementById("tr_tc_list");
	if(el_tr_tc_list.selectedIndex>0){
		el_tr_tc_list.selectedIndex = el_tr_tc_list.selectedIndex-1;
		selected_tc_change();
	}
}

function init_result_modal(){
	//console.log("Get info init_result_modal");
	var tcid = document.getElementById("tr_tc_list").value;
	var radio_verdicts=document.getElementsByName("test_verdict");
	for (var i=0,length=radio_verdicts.length; i<length;i++){
		//console.log(radio_verdicts[i]);
		radio_verdicts[i].checked = false;
	};
	document.getElementById("test_result_header").innerHTML = "TcID: "+tcid;
	//console.log(txt_tr_comment.innerHTML);
	document.getElementById("txt_tr_comment").value="";
	$("#txt_tr_attachment").val("");
	$("#txt_jira_hyperlink").val("");
}

function sticky_note_minimum(){
	var wid =48;
	var hgt = wid;
	var x_margin = 25;
	var y_margin = 60;
	$("#sticky_note").width(wid);
	$("#sticky_note").height(hgt);	
	var init_y = parseInt($(window).height()- hgt - y_margin)+"px";
	var init_x = parseInt($(window).width() - wid - x_margin)+ "px";
	$("#sticky_note").parent().css({position: 'relative'});
	$("#sticky_note").css({top:init_y, left:init_x, position:'fixed'});
	$("#txt_note").attr("hidden","");
}

function sticky_note_maximum(){
	//Enter
	var min_wid = 48;
	var min_hight = min_wid;
	var border = 8;
	var wid = parseInt($(window).width() * 0.4);
	var hgt = parseInt($(window).height() * 0.4);
	var x_margin = 25;
	var y_margin = 60;
	var posi_x = parseInt($(window).width() - wid - x_margin) + "px";
	var posi_y = parseInt($(window).height()-hgt - y_margin)+"px";
	$("#sticky_note").width(wid);
	$("#sticky_note").height(hgt);
	$("#sticky_note").parent().css({position: 'relative'});
	$("#sticky_note").css({top:posi_y, left:posi_x, position:'fixed'});
	$("#txt_note").height(hgt-min_hight-parseInt(border*2));
	$("#txt_note").width(wid-parseInt(border*2));
	$("#txt_note").css({top:parseInt(border/2),left:parseInt(border/2),position:'relative'});
	$("#txt_note").attr("hidden",null);
}

function commit_sticky_note(){
	$.ajax({
		url:'php/testrun.php',
		type:'POST',
		dataType:'json',
		data:{
			"action":"commit_sticky_note",			
			"trid":$("#data_trid").val(),
			"tcid":$("#tr_tc_list").val(),
			"userid":$("#data_uid").val(),
			"note":$('#txt_note').val()
		},
		success:function(response) {
			if(response.result=="Pass"){

			}
			else{
				alert(response.message);
			}
		},
	});
}

function sticky_note_set_value(txt){
	$("#txt_note").val(txt);
	if($("#txt_note").val()){
		$("#sticky_note").css('background-color','lightskyblue');
	}
	else{
		$("#sticky_note").css('background-color','lightgray');
	}
}

function hint_panel_maximum(){
	var min_wid = 36;
	var min_hight = min_wid;
	var wid = parseInt($(window).width() * 0.5);
	var hgt = parseInt($(window).height() * 0.6);
	$("#hint_panel").width(wid);
	$("#hint_panel").height(hgt);
    var body_height = hgt - $("#hint_header").height() - $("#hint_footer").height();
	$("#hint_body").height(body_height);
	$("#hint_panel [hideable]").attr("hidden",null);
	$("#hint_panel").css("border","1px solid");
	$("#hint_panel").css("background-color","aliceblue");
}

function hint_panel_minimum(){
	var wid =36;
	var hgt = wid;
	$("#hint_panel").width(wid);
	$("#hint_panel").height(hgt);
	$("#hint_panel [hideable]").attr("hidden","");
	$("#hint_panel").css("border","");
	$("#hint_panel").css("background-color","");
}

function hint_panel_switch_editable_mode(editable=false){
	$("#hint_edit_message").val("");
	if(editable==true){
		$("#hint_edit_message").val($("#hint_message").val());
		$("#hint_panel [hint_edit=true]").attr("hidden",null);
		$("#hint_panel [hint_edit=false]").attr("hidden","");
	}
	else{
		$("#hint_panel [hint_edit=true]").attr("hidden","");
		$("#hint_panel [hint_edit=false]").attr("hidden",null);
	}
}

function commit_hint(){
	var message = $("#hint_edit_message").val().trim();
	var old_message = $("#hint_message").val().trim();
	if(message && message.length>0 && message!=old_message){
		$.ajax({
			url:'php/testrun.php',
			type:'POST',
			dataType:'json',
			data:{
				"action":"commit_hint",			
				"tcid":$("#tr_tc_list").val(),
				"message":message,
				"updater":$('#data_uid').val()
			},
			success:function(response) {
				if(response.result=="Pass"){
					get_testcase_info();
				}
				else{
					alert(response.message);
				}
			},
			failed:function(response){
				alert(response.message);
			}
		});
	}
}

function change_hint_icon(has_hint){
	if(has_hint==true){
		$("#hint_icon").css("background-image","url('image/hint.png')");
	}
	else{
		$("#hint_icon").css("background-image","url('image/no_hint.png')");
	}
}

function get_st_wiki_link(){
	var link="http://10.0.13.183/dokuwiki/doku.php?id="+$("#tr_tc_list").val();
	$("#hint_wiki_link").attr("href",link);
}

function set_shift_for_top_panel(){
	var top_height = $("#top_panel").css("height");
	$('body').css("padding-top",top_height);
}

function copy_attachment_link() {
	var input = document.createElement("input");	
	input.value = $("#btn_attachment").attr("href");
	document.body.appendChild(input);
	input.select();
  	/* Copy the text inside the text field */
  	document.execCommand("copy");
  	input.remove();
 }

function removeCookie(cname){
    var d = new Date();
    d.setTime(0);
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=\"\";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cname, cvalue, exdays=1) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function switch_test_result_known_issue(){
	$("#data_test_result_issue_mode").val("known_issue");
	$("#btn_test_result_issue_mode").removeAttr("hidden");
	$("#form_failed_details").attr("hidden","");
	$("#lebel_tr_main").text("JIRA ID and Summary:");
	$("#btn_test_result_issue_mode").text("Is it a new issue?");
	$('#form_jira_hyper_link').removeAttr("hidden");
}

function switch_test_result_new_issue(){
	$("#data_test_result_issue_mode").val("new_issue");
	$("#btn_test_result_issue_mode").removeAttr("hidden");
	$("#form_failed_details").removeAttr("hidden");
	$("#lebel_tr_main").text("Summary");
	$("#btn_test_result_issue_mode").text("Is it a known issue?");
	$('#form_jira_hyper_link').attr("hidden","");
}

function submit_testresult(){
	var data ={
		"action":"submit_testresult",			
		"trid":$("#data_trid").val(),
		"tcid":$("#tr_tc_list").val(),
		"userid":$("#data_uid").val(),
		"verdict":$("#txt_testcase_verdict").attr("verdict")
	};
	if($('#txt_tr_comment').val()){
		data["comment"]=$("#txt_tr_comment").val();
	}
	if($("#txt_tr_attachment").val()){
		data["attachment"]=$("#txt_tr_attachment").val();
	}
	if ($("#txt_testcase_verdict").attr("verdict") =="Failed")
	{
		current_mode = $("#data_test_result_issue_mode").val();
		failed_details={};
		if(current_mode=='new_issue'){
			if($("#failed_reproduce_procedure").val()){			
				// data["failed_reproduce_procedure"]=$("#failed_reproduce_procedure").val();
				failed_details.reproduce_procedure = $("#failed_reproduce_procedure").val();
			}
			if($("#failed_expected_result").val()){
				// data["failed_expected_result"]=$("#failed_expected_result").val();
				failed_details.expected_result = $("#failed_expected_result").val();
			}
			if($("#failed_actual_result").val()){
				// data["failed_actual_result"]=$("#failed_actual_result").val();
				failed_details.actual_result = $("#failed_actual_result").val();
			}
			if($("#failed_sw_os_ver").val()){
				// data["failed_sw_os_version"]=$("#failed_sw_os_ver").val();
				failed_details.sw_os_version = $("#failed_sw_os_ver").val();
			}
			if($("#failed_sw_build_num").val()){
				// data["failed_sw_build_num"]=$("#failed_sw_build_num").val();
				failed_details.sw_build_num = $("#failed_sw_build_num").val();
			}
			if($("#failed_sw_build_date").val()){
				// data["failed_sw_build_num"]=$("#failed_sw_build_num").val();
				failed_details.sw_build_date = $("#failed_sw_build_date").val();
			}
			if($("#failed_hw_phase").val()){
				// data["failed_hw_phase"]=$("#failed_hw_phase").val();
				failed_details.hw_phase = $("#failed_hw_phase").val();
			}
			if($("#failed_hw_serial_num").val()){
				// data["failed_hw_serial_num"]=$("#failed_hw_serial_num").val();
				failed_details.hw_serial_num = $("#failed_hw_serial_num").val();
			}
			if($("#failed_benchmark").val()){
				// data["failed_benchmark"]=$("#failed_benchmark").val();
				failed_details.benchmark = $("#failed_benchmark").val();
			}			
		}
		else if (current_mode=='known_issue'){
			if($("#txt_jira_hyperlink").val()){
				// data["failed_jira_hyperlink"]=$("#txt_jira_hyperlink").val();
				failed_details.jira_hyperlink = $("#txt_jira_hyperlink").val();
			}
		}
		if(!$.isEmptyObject(failed_details)){
			// my_data["failed_details"] = failed_details;
			data.failed_details = failed_details;
		}
	}
	
	$.ajax({
		url:'php/testrun.php',
		type:'POST',
		dataType:'json',
		data:data,
		success:function(response) {
			if(response.result=="Pass"){
				$("#tr_tc_list").children("option:selected").attr("verdict",$("#txt_testcase_verdict").attr("verdict"));
				refresh_progress_table();
				next_tc();
			}
			else{
				alert(response.message);
			}
		},
	});
}

function test_result_issue_mode_toggle(){
	// attr = $("#form_failed_details").attr("hidden");
	// if(typeof attr !== typeof undefined && attr !== false){
	var current_mode = $("#data_test_result_issue_mode").val();	
	if(current_mode=='new_issue'){
		switch_test_result_known_issue();		
	}
	else{ 
		switch_test_result_new_issue();
	}
}

function testresult_failed_details_clear_up(){
	$("#form_failed_details [clearup]").val('');
}

function failed_details_clear_up(){
	$("#failed_details_modal textarea, #failed_details_modal input").val('');
	$("#data_failed_details_tcid").val('');
	$("#data_failed_details_updateTime").val('');
	$("#data_failed_details_tester").val('');
}

function failed_detail_editable(flag){
	if (flag){
		$("#btn_editable_failed_details").attr('edit_flag','True');
		$('#failed_details_modal textarea,#failed_details_modal input').removeAttr('readonly');
		$("#btn_editable_failed_details").css('background-color','royalblue');
		$('#btn_edit_failed_details').removeAttr('hidden');
		$('#btn_clear_failed_details').removeAttr('hidden');
	}
	else{
		$("#btn_editable_failed_details").attr('edit_flag','False');
		$('#failed_details_modal textarea,#failed_details_modal input').attr('readonly','');
		$("#btn_editable_failed_details").css('background-color','');
		$('#btn_edit_failed_details').attr('hidden','');
		$('#btn_clear_failed_details').attr('hidden','');
	}	
}

function failed_details_editable_toggle(){
	//Set failed_details non-editable
	if ($("#btn_editable_failed_details").attr('edit_flag')=="True"){
		failed_detail_editable(false);
	}
	//Set failed_details editable
	else{
		failed_detail_editable(true);
	}
}

function failed_details_edited(flag){
	if(flag){
		$("#btn_edit_failed_details").removeAttr("disabled");
	}
	else{
		$("#btn_edit_failed_details").attr("disabled",True);
	}
}

function failed_details_modal_enable(flag){
	if(flag){
		$("#current_tc_comment").attr('failed_details','');
		$("#current_tc_comment").attr("data-toggle","modal");
		$("#current_tc_comment").attr("data-target","#failed_details_modal");
	}
	else{
		$("#current_tc_comment").removeAttr('failed_details');
		$("#current_tc_comment").removeAttr("data-toggle");
		$("#current_tc_comment").removeAttr("data-target");
	}
}

function failed_details_to_clipboard(){
	var msg ="\
-----------------------------------------------------------------------------------\n\
| Tested By: {0}\n\
------------------------------------------------------------------------------------\n\
Test Case : {1}\n\
\n\
Actual Results: \n\
{2}\n\
\n\
Expected Results: \n\
{3}\n\
\n\
Procedure:\n\
{4}\n\
\n\
Benchmark:\n\
{5}\n\
\n\
=====================Software Details=====================\n\
Software Details:\n\
Build NO.: {6}\n\
Android Version: {7}\n\
Build Date:{8}\n\
\n\
=====================Hardware Detail=====================\n\
HW: {9}\n\
S/N: {10}\n\n".format(
		$("#data_failed_details_tester").val(),
		$("#txt_tc_id").text(),
		$("#text_actual_result").val(),
		$("#text_expected_result").val(),
		$("#text_reproduce_procedure").val(),
		$("#text_benchmark").val(),
		$("#text_sw_build_num").val(),
		$("#text_sw_os_version").val(),
		$("#text_sw_build_date").val(),
		$("#text_hw_phase").val(),
		$("#text_hw_serial_num").val()
	);
	// alert(msg);
	__set_text_to_clipboard(msg);
}

function present_failed_details(tcid,update_time,comment,failed_details,tester){
	$("#data_failed_details_tcid").val(tcid);
	$("#data_failed_details_tester").val(tester);
	$("#data_failed_details_updateTime").val(update_time);
	$("#subtitle_failed_summary").text("Summary:");
	$("#text_failed_summary").val(comment);
	if(failed_details.reperduce_procedure){$("#text_reproduce_procedure").val(failed_details.reperduce_procedure);}
	if(failed_details.expected_result){$("#text_expected_result").val(failed_details.expected_result);}
	if(failed_details.actual_result){$("#text_actual_result").val(failed_details.actual_result);}
	if(failed_details.sw_os_version){$("#text_sw_os_version").val(failed_details.sw_os_version);}
	if(failed_details.sw_build_num){$("#text_sw_build_num").val(failed_details.sw_build_num);}
	if(failed_details.sw_build_date){$("#text_sw_build_date").val(failed_details.sw_build_date);}
	if(failed_details.hw_phase){$("#text_hw_phase").val(failed_details.hw_phase);}
	if(failed_details.hw_serial_num){$("#text_hw_serial_num").val(failed_details.hw_serial_num);}
	if(failed_details.benchmark){$("#text_benchmark").val(failed_details.benchmark);}
}

function update_testresult_failed_details(){
	var my_data ={
			"action":"update_testresult_failed_details",
			"trid":$("#data_trid").val(),
			"tcid":$("#data_failed_details_tcid").val(),
			"updated_time":$("#data_failed_details_updateTime").val()
	};
	// Comments
	if($('#text_failed_summary').val()){
		my_data["comment"]=$("#text_failed_summary").val();
	}
	var current_mode = $("#data_test_result_issue_mode").val();
	//alert(current_mode);
	// ****************** Failed details begin ******************
	// ================== New issue mode begin ==================
	var failed_details={};
	if($('#text_reproduce_procedure').val()){
		// failed_details['reproduce_procedure'] = $('#text_reproduce_procedure').val();
		failed_details.reproduce_procedure=$('#text_reproduce_procedure').val();
	}
	if($('#text_expected_result').val()){
		// failed_details['expected_result'] = $('#text_expected_result').val();
		failed_details.expected_result=$('#text_expected_result').val();
	}
	if($('#text_actual_result').val()){
		// failed_details['actual_result'] = $('#text_actual_result').val();
		failed_details.actual_result=$('#text_actual_result').val();
	}
	if($('#text_sw_os_version').val()){
		// failed_details['sw_os_version'] = $('#text_sw_os_version').val();
		failed_details.sw_os_version=$('#text_sw_os_version').val();
	}
	if($('#text_sw_build_num').val()){
		// failed_details['sw_build_num'] = $('#text_sw_build_num').val();
		failed_details.sw_build_num=$('#text_sw_build_num').val();
	}
	if($('#text_sw_build_date').val()){
		// failed_details['sw_build_date'] = $('#text_sw_build_date').val();
		failed_details.sw_build_date=$('#text_sw_build_date').val();
	}
	if($('#text_hw_phase').val()){
		// failed_details['hw_phase'] = $('#text_hw_phase').val();
		failed_details.hw_phase=$('#text_hw_phase').val();
	}
	if($('#text_hw_serial_num').val()){
		// failed_details['hw_serial_num'] = $('#text_hw_serial_num').val();
		failed_details.hw_serial_num=$('#text_hw_serial_num').val();
	}
	if($('#text_benchmark').val()){
		// failed_details['benchmark'] = $('#text_benchmark').val();
		failed_details.benchmark=$('#text_benchmark').val();
	}
	if(!$.isEmptyObject(failed_details)){
		// my_data["failed_details"] = failed_details;
		my_data.failed_details = failed_details;
	}
	// ================== New issue mode end ==================
	// ****************** Failed details end ******************	
	$.ajax({
		url: 'php/testrun.php',
		type: 'POST',
		dataType: 'json',
		data:my_data ,
		success:function(response) {
			if(response.result=="Pass"){
			}
			else{
				alert(response.message);
			}
			failed_detail_editable(false);
		},
	});
}

function present_failed_jira_hyperlink(hyperlink=null){
	if(hyperlink){
		$("#current_tc_comment").attr('hyperlink',hyperlink);
	}
	else{
		$("#current_tc_comment").removeAttr('hyperlink');
	}
}

$(document).ready(function() {
	sticky_note_minimum();
	hint_panel_minimum();            
	//***************** submit_testresult ************************
	$("#btn_submit_testresult").click(function(){
		submit_testresult();
	});
	//***************** submit_button_enable ************************
	$("#txt_tr_comment").keyup(function(){
		if($("#txt_tr_comment").val() || $("#txt_testcase_verdict").attr("verdict")=="Passed"){
			$("#btn_submit_testresult").attr("disabled",null); //allow submit			
		}
		else{
			$("#btn_submit_testresult").attr("disabled","true");//disallow submit
		}
	});
	
	$("#txt_tr_comment").change(function(){
	if($("#txt_tr_comment").val() || $("#txt_testcase_verdict").attr("verdict")=="Passed"){
			$("#btn_submit_testresult").attr("disabled",null); //allow submit			
		}
		else{
			$("#btn_submit_testresult").attr("disabled","true");//disallow submit
		}
	});
	//***************** home button ***************** 
	$("#btn_backward").click(function(){
		var caller_path = getCookie("testrun_page_caller");
		if(caller_path&& caller_path!='undefined'){
			removeCookie("testrun_page_caller");
			window.location.replace(caller_path);
		}
		else{
			window.location.replace("testrun_selector.html");
		}
	});
	//**************** sticky note ***************** 
	$("#sticky_note").hover(function(){
		sticky_note_maximum();
	},function(){
		sticky_note_minimum();
	});

	$("#txt_note").change(function(){
		if($("#txt_note").val()){
			$("#sticky_note").css("background-color","LightSkyBlue");
		}
		else{
			$("#sticky_note").css("background-color","lightgray");
		}
		commit_sticky_note();		
		if($("#txt_note").val()){
			$("#tr_tc_list").children("option:selected").attr("has_note","");
		}
		else{
			$("#tr_tc_list").children("option:selected").attr("has_note",null);
		}
	});

	//**************** hint panel***************** 

	$("#hint_panel").hover(function(){
		hint_panel_maximum();
	},function(){
		hint_panel_minimum();
	});

	$("#hint_editable").click(function(){
		hint_panel_switch_editable_mode(true);
	});

	$("#hint_edit_cancel").click(function(){		
		hint_panel_switch_editable_mode(false);
		hint_panel_minimum();	
	});	

	$("#hint_edit_ok").click(function(){
		commit_hint();
		hint_panel_switch_editable_mode(false);
	});

	$("#btn_attachment").click(function(event){
		copy_attachment_link();
	});

	$("#btn_test_result_issue_mode").click(function(event){
		test_result_issue_mode_toggle();
	});

	$("#btn_editable_failed_details").click(function(){
		failed_details_editable_toggle();	
	});

	$("#btn_clear_failed_details").click(function(){
		failed_details_clear_up();	
	});

	$("#btn_edit_failed_details").click(function(){
		update_testresult_failed_details()
	});

	$("#current_tc_comment").click(function(){
		if($("#current_tc_comment").attr("hyperlink")){
			window.open($("#current_tc_comment").attr("hyperlink"));
		}
	});

	$("#btn_copy_to_clipboard").click(function(){
		failed_details_to_clipboard();
	});

	$(window).resize(function(){
		sticky_note_minimum();
	});

	//Enable tooltip
	$('[data-toggle="tooltip"]').tooltip();
});
