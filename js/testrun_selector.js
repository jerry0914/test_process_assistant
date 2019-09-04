
function set_tr_tc_filter(trid,tr_name="",documents="all",ary_verdicts=[],ary_auto=[],ary_tags=[]){
	//console.log("id="+trid+";name="+tr_name+";doc="+documents+";verdicts="+ary_verdicts.toString()+";automated="+ary_auto.toString()+";tags="+ary_tags.toString());
	$.ajax({
		url: 'php/testrun.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"set_tr_tc_filter",			
			"trid":trid,
			"tr_name":tr_name,
			"documents":documents,
			"verdicts": ary_verdicts,
			"automated":ary_auto,
			"tags":ary_tags
		},
		success: function(response) {
			if(response.result=="Pass"){
				setCookie("tr_tc_list_action","filter");
				setCookie("selected_id",trid);
				setCookie("selected_doc",documents);

				if(ary_verdicts && ary_verdicts.length>0){
					setCookie("selected_verdicts",ary_verdicts.toString());
				}
				else{
					removeCookie("selected_verdicts");
				}

				if(ary_auto && ary_auto.length>0){
					setCookie("selected_auto",ary_auto.toString());
				}
				else{
					removeCookie("selected_auto");
				}
				if(ary_tags && ary_tags.length>0){
					setCookie("selected_tags",ary_tags.toString());
				}
				else{
					removeCookie("selected_tags");
				}
				var page_name=document.location.href.match(/[^\/]+$/)[0];
				setCookie("testrun_page_caller",page_name);
				window.location.replace("testrun.html");
			}
		}
	});
}

function set_tr_tc_search(trid,tr_name="",ary_keywords=[],ary_search_cols=[]){//,ary_tcid=[],ary_title=[],ary_comment=[],ary_note=[]){
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
				setCookie("tr_tc_list_action","search");
				setCookie("selected_id",trid);
				if(ary_keywords && ary_keywords.length>0){
					setCookie("searching_keywords",ary_keywords);
				}
				else{
					removeCookie("searching_keywords");
				}
				if(ary_search_cols && ary_search_cols.length>0){
					setCookie("searching_columns",ary_search_cols);
				}
				else{
					removeCookie("searching_keywords");
				}
				window.location.replace("testrun.html");
			}
		}
	});
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

function get_tr_tags(trid){	
	$.ajax({
		url:'php/testrun.php',
		type:'POST',
		dataType:'json',
		data:{
			"action":"get_tr_tags",			
			"trid":trid
		},
		success:function(response) {
			if(response.result=="Pass"){
				var str_html="";
				if(response.tags){
					for (index in response.tags){
						var tag = response.tags[index];
						str_html+='<li><label class="dropdown-menu-item checkbox"><input type="checkbox"><span></span>'+response.tags[index]+'</label></li>';
					}					
				}
				else{
					str_html = "<li><label>No data</label></li>";
				}			
			}
			else{
				str_html = "<li><label>"+response.message+"</label></li>";
			}
			$("#ddm_tags_list").html(str_html);
			set_selected_tags();
		},
	});
}

function set_selected_tags(){
	var selected_tags = getCookie("selected_tags");
	$("#filter_tags").val("");
	//console.log("cookie_selected_tags="+selected_tags);	
	if(selected_tags && selected_tags.length>0){
		var ary_tags = selected_tags.split(",");
		 for(var i = 0; i <ary_tags.length; i++){
		 	var selector_str = "#ddm_tags_list li label:contains("+ary_tags[i]+") input:checkbox";
		 	console.log("selector_str="+selector_str);
		 	if($(selector_str).length){		 		
		 		$(selector_str).prop("checked",1);
		 		var str_tag = ary_tags[i];
		 		if($("#filter_tags").val().length>0){
		 			str_tag = $("#filter_tags").val()+","+str_tag;
		 		}
		 		$("#filter_tags").val(str_tag);
		 	}		 		
		}
	}
}

function restore_user_settings(){
	var act_type = getCookie("tr_tc_list_action");
	if(act_type=="search"){
		//Initialize checkboxes
		$("input[name=searching_columns]").each(function(){
			this.checked=0;
		});
		$("#search_Keywords").val();

		if(getCookie("searching_keywords").length>0){
			$("#search_Keywords").val(getCookie("searching_keywords"));
		}
		var ary_cols =  getCookie("searching_columns").split(",");
		if(ary_cols.length>0){
			ary_cols.forEach(function(txt){
				if(txt=="_ID" || txt=="_TcID"){
					$("#search_col_tcid").prop("checked",1);
				}
				else if(txt=="_Title"){
					$("#search_col_title").prop("checked",1);
				}
				else if(txt=="_Procedure"){
					$("#search_col_procedure").prop("checked",1);
				}
				else if(txt=="_ExpectedResult"){
					$("#search_col_exp_result").prop("checked",1);
				}
				else if(txt=="_Comment"){
					$("#search_col_comment").prop("checked",1);
				}
				else if(txt=="_Note"){
					$("#search_col_note").prop("checked",1);
				}				
			});
		}
		$("#search_tab").tab('show');
	}
	else{
		//Initialize checkboxes
		$("input[name=filter_verdicts],[name=filter_auto]").each(function(){
			this.checked=0;
		});

		if(getCookie("selected_doc").length>0){
			$("#filter_document").val(getCookie("selected_doc"));
		}

		if(getCookie("selected_verdicts").length>0){
			var ary = getCookie("selected_verdicts").split(",");
			ary.forEach(function(txt){
				if(txt=="P"){
					$("#filter_verdict_pass").prop("checked",1);
				}
				else if(txt=="F"){
					$("#filter_verdict_fail").prop("checked",1);
				}
				else if(txt=="B"){
					$("#filter_verdict_block").prop("checked",1);
				}
				else if(txt=="E"){
					$("#filter_verdict_exemption").prop("checked",1);
				}
				else if(txt=="I"){
					$("#filter_verdict_indeterminate").prop("checked",1);
				}
				else if(txt=="N"){
					$("#filter_verdict_none").prop("checked",1);
				}						
			});
		}

		if(getCookie("selected_auto").length>0){
			var ary = getCookie("selected_auto").split(",");
			ary.forEach(function(txt){
				if(txt=="A"){
					$("#ckbAutomated").prop("checked",1);
				}
				else if(txt=="S"){
					$("#ckbSemi_Auto").prop("checked",1);
				}
				else if(txt="N"){
					$("#ckbNon_Auto").prop("checked",1);							
				}
			});
		}
		$("#filter_tab").tab('show');
	}
}

function get_testrun_overview(trid){
	$("#table_tr_overview").find("tr:not(:first)").remove();
	$.ajax({
		url:'php/testrun.php',
		type:'POST',
		dataType:'json',
		data:{
			"action":"get_testrun_overview",			
			"trid":trid
		},
		success:function(response) {
			if(response.result=="Pass"){
				var option_html='<option value=\"all\">ALL</option>';
				var tbody_html='<tbody>';
				var amount=0;non_test=0,passed=0,failed=0,blocked=0,exempted=0,indeterminate=0;
				//***************** get_tr_documents ************************
				for (index in response.documents){
					var doc = response.documents[index];
					option_html+='<option value="'+doc.name+'"">'+doc.name+'</Option>'
					tbody_html+='<tr>';
					tbody_html+='<td col_grp="Title">'+doc.name+'</td>';
					tbody_html+='<td col_grp="All"><font>'+doc.amount+'</font></td>';
					tbody_html+='<td col_grp="P,F,B,E,I"><font>'+parseInt(doc.amount-doc.non_count)+'</font></td>';
					tbody_html+='<td col_grp="N"><font>'+doc.non_count+'</font></td>';
					tbody_html+='<td col_grp="P"><font>'+doc.p_count+'</font></td>';
					tbody_html+='<td col_grp="F"><font>'+doc.f_count+'</font></td>';
					tbody_html+='<td col_grp="B"><font>'+doc.b_count+'</font></td>';
					tbody_html+='<td col_grp="E"><font>'+doc.e_count+'</font></td>';
					tbody_html+='<td col_grp="I"><font>'+doc.i_count+'</font></td>';
					tbody_html+='</tr>';
					amount+=parseInt(doc.amount);
					non_test+=parseInt(doc.non_count);
					passed+=parseInt(doc.p_count);
					failed+=parseInt(doc.f_count);
					blocked+=parseInt(doc.b_count);
					exempted+=parseInt(doc.e_count);
					indeterminate+=parseInt(doc.i_count);						
				}
				tbody_html+='</tbody>'
				var tfoot_html='<tfoot><tr>';
				tfoot_html+='<td col_grp="Title">'+"Total"+'</td>';
				tfoot_html+='<td col_grp="All"><font>'+amount+'</font></td>';
				tfoot_html+='<td col_grp="P,F,B,E,I"><font>'+parseInt(amount-non_test)+'</font></td>';
				tfoot_html+='<td col_grp="N"><font>'+non_test+'</font></td>';
				tfoot_html+='<td col_grp="P"><font>'+passed+'</font></td>';
				tfoot_html+='<td col_grp="F"><font>'+failed+'</font></td>';
				tfoot_html+='<td col_grp="B"><font>'+blocked+'</font></td>';
				tfoot_html+='<td col_grp="E"><font>'+exempted+'</font></td>';
				tfoot_html+='<td col_grp="I"><font>'+indeterminate+'</font></td>';
				tfoot_html+='</tr></tfoot>';
				$("#filter_document").html(option_html);
				$("#table_tr_overview").append(tbody_html);
				$("#table_tr_overview").append(tfoot_html);
				$("#table_tr_overview").attr("hidden",null);
				restore_user_settings();
			}
			else
			{
				$("#table_tr_overview").attr("hidden","True");
			}
		},
	});
}

$(document).ready(function() {
	var myJson;
	//***************** set_tr_tc_filter ************************
	$("#btn_tr_select_submit").click(function(){
		//console.log("Selected_Tr_Name="+$("#filter_tesrun").children("option:selected").attr("name"));		
		var trid = $("#filter_tesrun").val();
		var tr_name = $("#filter_tesrun").children("option:selected").attr("name");
		var documents = $("#filter_document").val();
		var ary_verdicts = (function(){
						var ary = [];
						$("input[name='filter_verdicts']:checked").each(function(){
							ary.push($(this).val());
						});
						return ary;								
					}());
		var ary_auto = (function(){
						var ary = [];
						$("input[name='filter_auto']:checked").each(function(){
							ary.push($(this).val());
						});
						return ary;								
					}());
		var tags = $(filter_tags).val().trim();
		var ary_tags = null;
		if(tags && tags.length>0){
			ary_tags = tags.split(',');
		}
		set_tr_tc_filter(trid,tr_name,documents,ary_verdicts,ary_auto,ary_tags);
	});

	//***************** set_tr_tc_search ************************
	$("#btn_search").click(function(){
		var trid = $("#filter_tesrun").val();
		var tr_name = $("#filter_tesrun").children("option:selected").attr("name");
		//TCIDs
		// var ary_tcids = null;
		// var tcids = $("#search_ID").val().trim();
		// if(tcids && tcids.length>0){
		// 	ary_tcids = tcids.split(',');
		// }
		//Titles
		var ary_keywords = null;
		var keywords = $("#search_Keywords").val().trim();
		if(keywords && keywords.length>0){
			ary_keywords = keywords.split(',');
			//If there are keywords, and no searching-columns be checked,id-col does be selected by default;
			if($("input[name=searching_columns]:checked").length==0){
				$("#search_col_tcid").prop("checked",1);
			}
			var ary_search_cols = [];
			$("input[name=searching_columns]:checked").each(function(){
				ary_search_cols.push($(this).val());
			});
			set_tr_tc_search(trid,tr_name,ary_keywords,ary_search_cols);	
		}
		else{
			alert("Please input the keyword(s)");
		}
	});

	//***************** get_testrun_overview ************************
	$("#filter_tesrun").change(function() {
		//console.log("get_testrun_overview");
		var trid = $("#filter_tesrun").val();
		get_testrun_overview(trid);
		get_tr_tags(trid);
	});

	//***************** tr_overview td clicked ***************** 
	$("#table_tr_overview").on("click","td",function(){
		var grp = $(this).attr("col_grp");
		var doc = $(this).closest('tr').children("td").first().text();
		var tags = $(filter_tags).val();
		if(grp!="Title"){
			var count = parseInt($(this).text());
			if(count && count>0){
				var trid = $("#filter_tesrun").val();
				var tr_name = $("#filter_tesrun").children("option:selected").attr("name");
				var ary_verdicts = null;
				var ary_tags = null;
				if(doc=="Total"){
					doc="all";
				}
				if(grp=="All"){
					ary_verdicts = [];
					ary_verdicts.length=0;
				}
				else{
					ary_verdicts = [];
					ary_verdicts = grp.split(",");
				}
				if(tags &&  tags.length>0){
					ary_tags = [];
					ary_tags = tags.split(",");
				}
				var ary_auto = (function(){
						var ary = [];
						$("input[name='filter_auto']:checked").each(function(){
							ary.push($(this).val());
						});
						return ary;								
					}());
				set_tr_tc_filter(trid,tr_name,doc,ary_verdicts,ary_auto,ary_tags);
			}
		}
	});

	//Dropdown list of Tags menulist
    $("#ddm_tags_list").on('click',"li",function(event) {
        var $checkbox = $(this).find('.checkbox');
        if (!$checkbox.length) {
            return;
        }
        var $input = $checkbox.find('input');
        if ($input.is(':checked')) {
            $input.prop('checked',false);
        } else {
            $input.prop('checked',true);
        }
        var str_html = "";
        $("#ddm_tags_list li input:checked").parent("label").each(function(){
        	str_html+=this.innerText+',';
        });
        if(str_html.length>0){
        	str_html = str_html.substring(0,str_html.length-1) //Trim the last comma
        }
        $("#filter_tags").val(str_html);       
        return false;
    });

    //***************** Start up ************************

    //***************** get_active_testrun_list ************************
	$.ajax({
		url: 'php/testrun.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"get_active_testrun_list"
		},
		success: function(response) {
			if(response.result=="Pass"){
				option_html='<option value="-1">--</option>';
				for (index in response.testruns){
					option_html+='<option '+
								 'value="'+response.testruns[index].ID+'" '+
								 'name="'+response.testruns[index].Name+'" '+
								 '>'+response.testruns[index].Name+'</Option>'
				}
				$("#filter_tesrun").html(option_html);
			}
			if(getCookie("selected_id").length>0){
				$("#filter_tesrun").val(getCookie("selected_id"));
				var trid = $("#filter_tesrun").val();
				get_testrun_overview(trid);
				get_tr_tags(trid);			
			}
		}
	});
});