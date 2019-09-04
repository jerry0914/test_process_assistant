function get_testrun_list(){
	$.ajax({
		url: 'php/testrun.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"get_testrun_list"
		},
		success: function(response) {
			if(response.result=="Pass"){
				option_html='<option value=NULL>--</option>';
				for (index in response.testruns){
					option_html+='<option '+
								 'value="'+response.testruns[index].ID+'" '+
								 'active="'+response.testruns[index].Active+'" '+
								 'owner="'+response.testruns[index].Owner+'" '+
								 '>'+response.testruns[index].Name+'</Option>'
				}
				$("#testrun_list").html(option_html);
				__show_inactive_testruns();
			}
		}
	});
}

function search_testresult_by_trid_tcid(selected_testruns=[],txt_tcids="",verdicts=[],txt_comments=""){
	__clear_testresult_table();
	var data = {
		action:"search_testresult_by_trid_tcid"
	};
	var selected_trids = selected_testruns.map(function (el) { return el.id; });
	if(selected_trids && selected_trids.length>0){
		data.search_testresult_trids = selected_trids;
	}	
	if(txt_tcids.length>0){
		data.search_testresult_tcids = txt_tcids.split(",");
	}
	if(verdicts && verdicts.length>0){
		data.search_testresult_verdicts=verdicts;
	}
	if(txt_comments.length>0){
		data.search_testresult_comments = txt_comments.split(",");
	}
	$.ajax({
		url: 'php/testresult_review.php',
		type: 'POST',
		dataType: 'json',
		data: data,
		success: function(response) {
			if(response.result=="Pass"){
				var index,html_str;
				for(index=0;index<response.testresult.length;index++){
					var testresult = response.testresult[index];
					var trun_name = $("#testrun_list>option[value="+testresult.TrID+"]").html();
					var comment = (testresult.Comment!=null)?testresult.Comment:"";
					html_str="<tr>";
					html_str+="<td col=\"testrun\">"+trun_name+"</td>";
					html_str+="<td col=\"tcid\" trid=\""+testresult.TrID+"\"><font>"+testresult.TcID+"</font></td>";
					html_str+="<td col=\"verdict\" value=\""+testresult.Verdict +"\">"+testresult.Verdict.substring(0,1)+"</td>";
					html_str+="<td col=\"comment\">"+comment+"</td>";
					var attach_html=""
					if(testresult.AttachmentLink)
					{
						attach_html="<a href=\""+testresult.AttachmentLink+"\" data-toggle=\"tooltip\" data-placement=\"right\" title=\""+testresult.AttachmentLink+"\">Link</a>";
					}
					html_str+="<td col=\"attachment\">"+attach_html+"</td>";
					html_str+="<td col=\"tester\">"+testresult.Tester+"</td>";
					html_str+="</tr>";
					$("#table_testresult_review>tbody").append(html_str);
				}
				__relayout();
				//restore scroll-bar position
				var scrollTop = getCookie("testresult_review_scrollTop");
				if(scrollTop){
					$("#centrial_panel:first").scrollTop(scrollTop);	
				}	
			}
		}
	});
}

function submit_edited_result(){
	var ary_edited_rows = $("#table_testresult_review>tbody tr").has("td[edited]").toArray();
	__submit_edited_result_list(ary_edited_rows);
}

function __submit_edited_result_list(ary_edited_rows){
	var row = ary_edited_rows.pop();
	var tcid_cell = $(row).children("td[col=tcid]:first");
	var verdict_cell = $(row).children("td[col=verdict]:first");
	var comment_cell = $(row).children("td[col=comment]:first");
	var attachment_el = $(row).children("td[col=attachment]").children("a:first");
    var userid = $("#data_uid").val();
	if(tcid_cell && verdict_cell){
		var data ={
			"action":"submit_testresult",			
			"trid":tcid_cell.attr("trid"),
			"tcid": tcid_cell.text(),
			"userid":userid,
			"verdict":verdict_cell.attr("value")
		};
		if(comment_cell){
			data.comment=comment_cell.text();
		}
		if(attachment_el){
			data.attachment = attachment_el.attr("href");
		}
		$.ajax({
			url:'php/testrun.php',
			type:'POST',
			dataType:'json',
			data:data,
			success:function(response) {
				if(response.result=="Pass"){
					$(row).children("td[edited]").removeAttr("edited");
				}
				else{
					alert(response.message);
				}
			},
			error:function(response){
				alert(response);
			},
			complete:function(response){
				if(ary_edited_rows.length>0){
					__submit_edited_result_list(ary_edited_rows);
				}
				else{
					__check_data_edited();
					setTimeout(function(){
						alert("Finished");
					},500);					
				}
			}
		});			
	}
}

function set_tr_tc_search(trid,tr_name="",ary_keywords=[],ary_search_cols=[]){
	$.ajax({
		url: 'php/testrun.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"set_tr_tc_search",
			"trid":trid,
			"tr_name":tr_name,	
			"keywords":ary_keywords,
			"search_cols":ary_search_cols
		},
		success: function(response) {
			if(response.result=="Pass"){
				var page_name=document.location.href.match(/[^\/]+$/)[0];
				setCookie("testrun_page_caller",page_name);
				window.location.replace("testrun.html");
			}
		}
	});
}

function restore_user_selections(){
	var need_query = false;
	var txt_testruns = getCookie("testresult_review_testruns");
	var selected_testruns=[];
	if(txt_testruns){
		selected_testruns = JSON.parse(txt_testruns);
		if(selected_testruns){ 
			__restore_selected_testruns(selected_testruns);
			need_query = true;
		}
	}
	var trids = getCookie("testresult_review_tcids");
	if(trids){
		$("#search_testresult_tcid").val(trids);
		need_query = true;
	}
	var txt_verdicts = getCookie("testresult_review_verdicts");
	var verdicts =[];
	if(txt_verdicts){
		$("input[name=filter_verdicts]").prop("checked",null);
		var verdicts = JSON.parse(txt_verdicts);
		verdicts.forEach(function(verdict){
			$("input[name=filter_verdicts][value="+verdict+"]").prop("checked","true");
		});
	}
	var txt_comments = getCookie("testresult_review_comments");
	if(txt_comments){
		$("#search_testresult_comment").val(txt_comments);
	}
	__query_button_enable_check();
	if(need_query){
		setTimeout(function() {
			search_testresult_by_trid_tcid(selected_testruns,trids,verdicts,txt_comments);
		}, 350);		
	}

	//display left_panel
	var diaplay_left_panel = getCookie("testresult_review_show_leftpanel");
	__display_left_panel(diaplay_left_panel=="true");
}

function setCookie(cname, cvalue, exdays=1) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
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

function __sortTable(table,index) {
	var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0,val_x,val_y;
	switching = true;
	//Set the sorting direction to ascending:
	dir = "asc"; 
	/*Make a loop that will continue until
	no switching has been done:*/
	while (switching) {
		//start by saying: no switching is done:
		switching = false;
		rows = $(table).children("tbody").children("tr").toArray();
		/*Loop through all table rows (except the
		first, which contains table headers):*/
		for (i = 0; i < (rows.length-1); i++) {
			//start by saying there should be no switching:
			shouldSwitch = false;
			/*Get the two elements you want to compare,
			one from current row and one from the next:*/
			x = rows[i].getElementsByTagName("td")[index];
			y = rows[i + 1].getElementsByTagName("td")[index];
			val_x = parseInt($(x).text()) || $(x).text().toLowerCase();
			val_y = parseInt($(y).text()) || $(y).text().toLowerCase();
			/*check if the two rows should switch place,
			based on the direction, asc or desc:*/
			if (dir == "asc") {
				if (val_x > val_y) {
					//if so, mark as a switch and break the loop:
					shouldSwitch= true;
					break;
				}
			} 
			else if (dir == "desc"){
				if (val_x < val_y) {
					//if so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			}
		}
		if (shouldSwitch) {
			/*If a switch has been marked, make the switch
			and mark that a switch has been done:*/
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
			//Each time a switch is done, increase this count by 1:
			switchcount ++;      
		} 
		else {
			/*If no switching has been done AND the direction is "asc",
			set the direction to "desc" and run the while loop again.*/
			if (switchcount == 0 && dir == "asc") {
				dir = "desc";
				switching = true;
			}
		}
	}
}

// Helper function to get an element's exact position
function __getPosition(el) {
  var rect = el.getBoundingClientRect();
  return{
  	x:rect.left,
  	y:rect.top,
  	width:rect.width,
  	height:rect.height
  };
}

function __clear_testresult_table(){
	$("#table_testresult_review>tbody>tr").remove();
}

function __show_inactive_testruns(){
	var checked = $("#ckb_show_inactive_tr").prop("checked");
	if(checked){
		$("#testrun_list option[active=0]").show();
	}
	else{
		$("#testrun_list option[active=0]").hide();
	}	
}

function __get_selected_testrun(){
	var elements = $("#table_selected_testrun>tbody>tr");
	var list = [],index;
	for(index =0; index<elements.length;index++){
		var tr ={
			id:elements[index].getAttribute("value"),
			name:elements[index].children[0].textContent
		};
		list.push(tr);
	}
	return list;
}

function __restore_selected_testruns(testruns){
	$("#table_selected_testrun>tbody>tr").remove();
	var index;
	for(index=0;index<testruns.length;index++){
		var html_str="<tr value=\""+testruns[index].id+"\">";
		html_str+="<td col=\"tr_name\">"+testruns[index].name+"</td>";
		html_str+="<td col=\"tr_remove\">"+"<button>x</button>"+"</td>";
		html_str+="</tr>";
		$("#table_selected_testrun>tbody").append(html_str);
	}
}

function __add_tr_to_list(trid,tr_name){
	var is_exist = $("#table_selected_testrun>tbody>tr[value="+trid+"]").length>0;
	if(is_exist){
		alert("TestRun is already in the list.");
	}
	else{
		var html_str="<tr value=\""+trid+"\">";
		html_str+="<td col=\"tr_name\">"+tr_name+"</td>";
		html_str+="<td col=\"tr_remove\">"+"<button>x</button>"+"</td>";
		html_str+="</tr>";
		$("#table_selected_testrun>tbody").append(html_str);
		__query_button_enable_check();
	}
}

function __query_button_enable_check(){
	var is_tr_list_empty = $("#table_selected_testrun>tbody>tr[value]").length==0;
	var is_tcid_empty = $("#search_testresult_tcid").val().length==0;
	if(is_tr_list_empty && is_tcid_empty){
		$("#btn_tr_review_query").attr("disabled","true");
	}
	else{
		$("#btn_tr_review_query").removeAttr("disabled");
	}
	if(is_tr_list_empty){
		$("#multiple_testrun_overview").attr("hidden","true");
	}
	else{
		$("#multiple_testrun_overview").removeAttr("hidden");
	}
}

function __remove_tr_from_list(trid){
	var tr = $("#table_selected_testrun>tbody>tr[value="+trid+"]");
	if(tr){
		tr.remove();
		__query_button_enable_check();
	}
	else{
		alert("TrID: "+trid+" does not exist");
	}
}

function __show_verdict_dialog(target){
	var pos = __getPosition(target);
	var dialog=$("#verdictDialog");
	var select=$("#verdictDialog>select");
	select.val($(target).attr("value"));
	dialog.css("display","block");
	dialog.css("left",pos.x);
	dialog.css("top",pos.y);
	select.on("change",function(){
		$(target).attr("value",select.val());
		$(target).html($("#verdictDialog>select :selected").html());
		$(target).attr("edited","true");
		__hind_verdict_dialog();
		__check_data_edited();
	});
}
	
function __hind_verdict_dialog(){
	 $("#verdictDialog").css("display","none");
	 $("#verdictDialog>select").off();
}

function __show_comment_dialog(target){
	var dialog=$("#commentDialog");
	var txt_comment=$("#commentDialog textarea");
	txt_comment.val($(target).html());
	dialog.css("display","block");
	dialog.css("left",$(window).width()*0.33);
	dialog.css("top",$(window).height()*0.33);
	txt_comment.focus();
	$("#commentDialog .btn-outline-success").on("click",function(){
		var new_comment = txt_comment.val();
		if(new_comment!=$(target).html()){
			$(target).html(new_comment);
			$(target).attr("edited","true");
		}
		__hind_comment_dialog();
		__check_data_edited();
	});
}

function __hind_comment_dialog(){
	$("#commentDialog").css("display","none");
	$("#commentDialog .btn-outline-success").off();
}

function __relayout(){
	var width = $(window).width();
	var height = ($(window).height() - $("body nav").height() - $("#top_panel").height()) *0.92;

	$("#left_panel").css("max-height",height);
	$("#centrial_panel").css("max-height",height);
	if($("#left_panel").attr("hidden")){
		$("#centrial_panel").css("width",width);
	}
	else{
		$("#left_panel").css("width",width*0.20);
		$("#centrial_panel").css("width",width*0.78);
	}
}

function __display_left_panel(show_flag){
	if(show_flag==true){
		$("#left_panel").removeAttr("hidden");
		$("#toggle_left_panel").html("<<");		
	}
	else{
		$("#left_panel").attr("hidden","true");
		$("#toggle_left_panel").html(">>");
	}
	setCookie("testresult_review_show_leftpanel",show_flag);
	__relayout();
}

function __check_data_edited(){
	var is_data_edited = $("#table_testresult_review td[edited]").length>0;
	if(is_data_edited){
		$("#btn_save_edited_result").removeAttr("hidden");
	}
	else{
		$("#btn_save_edited_result").attr("hidden","true");
	}
	return is_data_edited;
}

function __auto_scroll_top_of_table_testresult(td){
	var scrollTop = ($(td).position().top - $("body nav").height() - $("#top_panel").height());
	$("#centrial_panel").scrollTop(scrollTop);
}

function __find_previous_col(text){
	var __selector = "#table_testresult_review>tbody td:contains('"+text+"')";
	__find_all_col_matched(__selector);
	var tds = $("#table_testresult_review>tbody td.matched").toArray();
	var selected_obj = $("#table_testresult_review>tbody td.selected:first");
	var selected_index=0;
	if(selected_obj.length>0){		
		selected_index = tds.indexOf(selected_obj.get(0));
		selected_obj.removeClass("selected");
		selected_index = (selected_index>0)?selected_index-1:tds.length-1;
	}
	$(tds[selected_index]).addClass("selected");
	__auto_scroll_top_of_table_testresult(tds[selected_index]);
}

function __find_next_col(text){
	var __selector = "#table_testresult_review>tbody td:contains('"+text+"')";
	__find_all_col_matched(__selector);
	var tds = $("#table_testresult_review>tbody td.matched").toArray();
	var selected_obj = $("#table_testresult_review>tbody td.selected:first");
	var selected_index=0;
	if(selected_obj.length>0){		
		selected_index = tds.indexOf(selected_obj.get(0));
		selected_obj.removeClass("selected");
		selected_index = (selected_index+1) % tds.length;
	}
	$(tds[selected_index]).addClass("selected");
	__auto_scroll_top_of_table_testresult(tds[selected_index]);
}

function __find_all_col(text){
	var __selector = "#table_testresult_review>tbody td:contains('"+text+"')";
	__find_all_col_matched(__selector);
	var tds = $("#table_testresult_review>tbody td.matched");
	tds.addClass("heightlight");
}

function __find_all_col_matched(selector){
	var tds = $(selector);
	tds.addClass("matched");
	if(tds.length==0){
		alert("There are no items found!");
	}
}

function __buttons_of_find_functions_enable(flag){
	if(flag==true){
		$("#searching_panel [searching_toggle]").removeAttr("disabled");
	}
	else{
		$("#searching_panel [searching_toggle]").attr("disabled","true");
	}
}

function __clear_find_col_result(){
	var tds = $("#table_testresult_review>tbody td.matched,td.selected,td.heightlight");
	tds.removeClass("matched");
	tds.removeClass("heightlight");
	tds.removeClass("selected");
}

function __replace(searching_text,replace_text){
	var td = $("#table_testresult_review>tbody td[col=comment].selected").get(0);
	if(td){
		var text = $(td).text().replace(new RegExp(searching_text, 'g'), replace_text);
		$(td).html(text);
		$(td).attr("edited","true");
		__check_data_edited();
		$(td).removeClass("matched");
		$(td).removeClass("heightlight");
	}
	else{
		alert("It's not editable.");
	}
}

function __replace_all(searching_text,replace_text){	
	var __selector = "#table_testresult_review>tbody td[col=comment]:contains('"+searching_text+"')";
	__find_all_col_matched(__selector);
	var tds = $("#table_testresult_review>tbody td.matched");
	tds.addClass("heightlight");
	if(tds.length>0){
		setTimeout(function(){
		 	if (confirm(tds.length+ ' items found, do you want to modify them all?')) {
		 		for(var i=0;i<tds.length;i++){
		 			var td = tds[i];
		 			var text = $(td).text().replace(new RegExp(searching_text, 'g'), replace_text);
					$(td).html(text);
					$(td).attr("edited","true");
					$(td).removeClass("matched");
					$(td).removeClass("heightlight");
		 		}
				__check_data_edited();	
			} else {
			    // Do nothing!
		 	}
		},250);
	}
}

function __display_replace_row(show_flag){
	if(show_flag){
		$("#replace_row").removeAttr("hidden");
	}
	else{
		$("#replace_row").attr("hidden","true");
	}
}


$(document).ready(function(){
	get_testrun_list();
	restore_user_selections();
	$("#ckb_show_inactive_tr").change(function(){		
		__show_inactive_testruns();
	});

	$("#btn_add_tr_to_list").click(function(){
		if($("#testrun_list").val()>=0){
			__add_tr_to_list($("#testrun_list").val(),$("#testrun_list :selected").text());
		}
		else{
			alert("please select a testrun.");
		}
	});

	$("#testrun_list").change(function(){
		var btn_select_enable =$("#testrun_list").val()>=0;
		if(btn_select_enable){
			$("#btn_add_tr_to_list").removeAttr("disabled");
		}
		else{
			$("#btn_add_tr_to_list").attr("disabled","true");
		}
	});

	$("#table_selected_testrun").on("click","td[col=tr_remove]>button",function(){
		var remove_trid=this.parentElement.parentElement.getAttribute("value"); //Get trid from button<--td<--tr
		__remove_tr_from_list(remove_trid);
	});

	$("#toggle_left_panel").click(function(){
		var show_flag = $("#left_panel").attr("hidden")?true:false;	
		__display_left_panel(show_flag);
	});

	$("#btn_tr_review_query").click(function(){
		var selected_testruns = __get_selected_testrun();
		if(selected_testruns){
			var txt_testruns = JSON.stringify(selected_testruns);
			setCookie("testresult_review_testruns",txt_testruns);
		}
		else{
			removeCookie("testresult_review_testruns");
		}
		var txt_tcids = $("#search_testresult_tcid").val();
		if(txt_tcids.length>0){
			setCookie("testresult_review_tcids",txt_tcids);
		}
		else{
			removeCookie("testresult_review_tcids");
		}
		var verdicts = [];
		if($("input[name=filter_verdicts]:checked").length>0){
			$("input[name=filter_verdicts]:checked").each(function(){
				verdicts.push(this.value)});
			setCookie("testresult_review_verdicts",JSON.stringify(verdicts));
		}
		else{
			removeCookie("testresult_review_verdicts");
		}
		var txt_comments = $("#search_testresult_comment").val();
		if(txt_comments.length>0){
			setCookie("testresult_review_comments",txt_comments);
		}
		else{
			removeCookie("testresult_review_comments");
		}
		removeCookie("testresult_review_scrollTop");
		search_testresult_by_trid_tcid(selected_testruns,txt_tcids,verdicts,txt_comments);
	});

	$("#search_testresult_tcid").keyup(function(){
		__query_button_enable_check();
	});

	$("#table_testresult_review>tbody").on("click","td[col=tcid]",function(){
		var trid = this.getAttribute("trid");
		var tr_name_element = this.previousSibling;
		var tr_name = tr_name_element.textContent;
		var tcid = this.textContent;
		//Store scroll-bar position
		setCookie("testresult_review_scrollTop",$("#centrial_panel:first").scrollTop());
		set_tr_tc_search(trid,tr_name,[tcid],["_TcID"]);
	})
	.on("dblclick","td[col=verdict]",function(){
		__show_verdict_dialog(this);
	})
	.on("dblclick","td[col=comment]",function(){
		__show_comment_dialog(this);
	})
	;

	$("#table_testresult_review>thead th").dblclick(function(){		
		// var nodes = Array.prototype.slice.call($("#table_testresult_review>thead>tr").children());
		// var index = nodes.indexOf(this);
		var columns = $(this).parent().children("th").toArray();
		var index = columns.indexOf(this);
		__sortTable($("#table_testresult_review").get(0),index);
	});

	$("#verdictDialog .close").click(function(){
		__hind_verdict_dialog();
	});

	$("#commentDialog .btn-outline-danger").click(function(){		
		__hind_comment_dialog();
	});

	$("#btn_save_edited_result").click(function(){
		submit_edited_result();
	});

	$("#btn_search_replace_toggle").click(function(){
		var __is_shown = ($("#replace_row").attr("hidden"))?false:true;
		__display_replace_row(!__is_shown);
	});

	$("#btn_search_col").click(function(){
		__clear_find_col_result();
		var search_text = ($("#search_text").val()) ? $("#search_text").val(): null;
		if(search_text){
			__find_all_col(search_text);
		}
	});

	$("#btn_replace").click(function(){
		var search_text = ($("#search_text").val()) ? $("#search_text").val(): null;
		var replace_text = (!$("#replace_row").attr("hidden") && $("#replac_text").val()) ? $("#replac_text").val():"";
		__replace(search_text,replace_text);
	});


	$("#btn_replace_all").click(function(){
		__clear_find_col_result();
		var search_text = ($("#search_text").val()) ? $("#search_text").val(): null;
		var replace_text = (!$("#replace_row").attr("hidden") && $("#replac_text").val()) ? $("#replac_text").val():"";
		if(search_text)
		{
			__replace_all(search_text,replace_text)
		}
		else{
			alert("There are no searching text.");
		}
	});

	$("#btn_find_previous").click(function(){
		var searching_text=$("#search_text").val();
		__find_previous_col(searching_text);
	});

	$("#btn_find_next").click(function(){
		var searching_text=$("#search_text").val();
		__find_next_col(searching_text);
	});

	$("#search_text").keyup(function(){
		__clear_find_col_result();
		if($("#search_text").val()){
			__buttons_of_find_functions_enable(true);
		}
		else{
			__buttons_of_find_functions_enable(false);
		}
	});

	$("#multiple_testrun_overview").click(function(){
		var selected_testruns = __get_selected_testrun();
		if(selected_testruns && selected_testruns.length>0){
			var str_testruns = JSON.stringify(selected_testruns);
			setCookie("multi_tr_query",str_testruns);
			window.open('./multiple_testrun_overview.html',
						'_blank',
						'menubar=no,location=no,scrollbars=yes,status=yes'+
						',width='+($(window).width()*0.95)+
						',height='+($(window).height()*0.95)+
						',left='+($(window).width()*0.05)+
						',top='+($(window).height()*0.05)
						);
		}
	});
	$(window).click(function(el){
		var verdict_dialog = $('#verdictDialog');
		var comment_dialog = $('#commentDialog');
		if(verdict_dialog.css("display")!="none"){			
			if($(el.target).closest(verdict_dialog).length > 0){
				//Do NOTHING, Skip the click from children of verdictDialog
	    	}
	    	else{
	    		__hind_verdict_dialog();
	    	}
		}
		if(comment_dialog.css("display")!="none"){
			if($(el.target).closest(comment_dialog).length > 0){
				//Do NOTHING, Skip the click from children of comment_dialog
	    	}
	    	else{
	    		__hind_comment_dialog();
	    	}
		}
	})
	.resize(function(){
		__relayout();
	})
	.bind('beforeunload', function() {
		if(__check_data_edited()){
	  		return "資料已修改，尚未儲存!";
		}
	});
});
