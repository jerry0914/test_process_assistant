function export_testrun(trid,base_file,tester_filter_id=-1,doc='ALL',verdicts=null){
	$.ajax({
		url: 'php/testrun_management.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"export_testrun",
			"trid":trid,
			"base_file":base_file,
			"tester_id":tester_filter_id,
			"document":doc,
			"verdicts":(verdicts)?(verdicts.toString()):null
		},
		success: function(response) {
			if(response.result=="Pass"){
				//saveByteArray(response.base64,"output.xls");
				__update_message_and_progressbar("Success!","green",100,6000);
				__establish_download_link_from_byte64_data(response.base64,response.file_name);
				if($("#ckb_set_tr_finished").prop("checked")){
					testrun_active_state_change(trid,0);
				}
			}
			else{
				__update_message_and_progressbar(response.message,"red",50,6000);
			}
		},
		fail:function(response){
			var message = "Fail to export testrun;\n"+response;
			__update_message_and_progressbar(message,"red",50,6000);
		}
	});
}

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

function get_active_users(){
	$.ajax({
		url: 'php/testrun_management.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"get_active_users"
		},
		success: function(response) {
			if(response.result=="Pass"){
				option_html='<option value="-1">ALL</option>';
				for (index in response.users){
					option_html+='<option '+
								 'value="'+response.users[index].ID+'" >'+
								response.users[index].FirstName+"_"+response.users[index].LastName+'</Option>'
				}
				$("#export_trs_filter_tester").html(option_html);
				if($("#data_user_permission").val()==2){
					$("#export_trs_filter_tester").val($("#data_uid").val());
				}			
			}
		}
	});
}

function get_tr_documents(trid){
	$("#document_list").html("");
	$.ajax({
		url: 'php/testrun.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"get_tr_documents",
			"trid":trid
		},
		success: function(response) {
			if(response.result=="Pass"){
				option_html='<option value="all">ALL</option>';
				for (index in response.documents){
					option_html+='<option value="'+response.documents[index]+'"">'+response.documents[index]+'</Option>';
				}
				$("#document_list").html(option_html);				
			}
		}
	});	
}

function find_tr_trs_files(trid){
	$("#export_trs_file").html("");
	$("#upload_export_trs_file").val("");
	$.ajax({
		url: 'php/testrun_management.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"find_tr_trs_files",
			"trid":trid
		},
		success: function(response) {
			if(response.result=="Pass"){
				option_html='<option value=NULL>---</option>';
				for (index in response.trs_files){
					option_html+='<option value="'+response.trs_files[index].path+'">'+response.trs_files[index].name+'</Option>';
				}
				$("#export_trs_file").html(option_html);
				if(response.trs_files.length==1){
					$("#export_trs_file option")[1].selected=true;
				}				
			}
		}
	});	
}

function upload_trs_files_for_export(trid,files){
	__upload_trs_files(
		trid,
		files,
		function(response){
            if(response.result=="Pass"){
                var message ="";
                //var trs_files=[];
                response.files.forEach(function(file){
                    message += (file.basename+ ";\n ");
                    //trs_files.push(file.server_path);
                });
                message += "upload successfully.";
                $("#upload_modal_response_msg").css("color","green");
                $("#upload_modal_response_msg").html(message);
                setTimeout(function() {
	              //your code to be executed after delay time in milliseconds
	            	$("#upload_modal_response_msg").css("color","black");
                	$("#upload_modal_response_msg").html("");
	            	$('#modal_upload_files').modal('toggle'); //Close the modal of trs_files upload
	            }, 1200);
                find_tr_trs_files(trid);
            }
            else{
                $("#upload_modal_response_msg").css("color","red");
                $("#upload_modal_response_msg").html(response.message); 
            }      
        },
    	function(response){
	    	$("#upload_modal_response_msg").css("color","red");
	    	$("#upload_modal_response_msg").html("Failed to upload TRS file(s)"+"\n"+response);
    	}
    );
}

function upload_trs_files_for_add_testcases(trid,files){
	__upload_trs_files(
		trid,
		files,
		function(response){ 
            if(response.result=="Pass"){
            	var message ="";
                var trs_files=[];
                response.files.forEach(function(file){
                    message += (file.basename+ ";\n ");
                    trs_files.push(file.server_path);
                });
                message += "upload successfully.";
                __update_message_and_progressbar(message,"green",20);
             	add_testcase_to_testrun(trid,
                                        trs_files,
                                        $("#ckb_tc_automated_update").prop("checked"),
                                        $("#ckb_tc_tag_update").prop("checked"));            
            }
            else{
                __update_message_and_progressbar(response.message,"red",20,6000);
            }     
        },
        function(response){
            var message = "Failed to upload TRS file(s)"+"\n"+response;
            __update_message_and_progressbar(message,"red",20,6000);
        }
    );
}

function add_testcase_to_testrun(trid,trs_files,update_automated=false,update_tag=false){
    $.ajax({
        url: "php/testrun_management.php",
        type: 'post',
        dataType: 'json',
        data: {
            "action":"add_testcase_to_testrun",
            "trid":trid,
            "trs_files":trs_files,
            "update_automated":update_automated,
            "update_tag":update_tag
        },
        success: function(response){
            if(response.result=="Pass"){
                var message = "Done! Add "+response.tc_count+" testcase(s) into "+ $("#testrun_list :selected").text();
                __update_message_and_progressbar(message,"green",100,6000); 
            }
            else{
                __update_message_and_progressbar(response.message,"red",50,6000); 
            }    
        }
    });
}

function testrun_active_state_change(trid,active){
	$.ajax({
        url: "php/testrun_management.php",
        type: 'post',
        dataType: 'json',
        data: {
            "action":"update_testrun_active",
            "trid":trid,
            "active":active
        },
        success: function(response){
            if(response.result=="Pass"){
            	__testrun_finished_state_changed(active);
            	$("#testrun_list :selected").attr("active",active);
            }
            else{
                __testrun_finished_state_changed(-1);
            }    
        }
    });	
}

function delete_testrun(trid){
	$.ajax({
        url: "php/testrun_management.php",
        type: 'post',
        dataType: 'json',
        data: {
            "action":"delete_testrun",
            "trid":trid
        },
        success: function(response){
            if(response.result=="Pass"){
            	get_testrun_list();
            }
            else{
            }    
        }
    });
}

function import_tested_result(trid,user_id,files){
	__upload_test_result_files(
	trid,
	files,
	function(response){
		if(response.result=="Pass"){
			var message ="";
			var uploaded_files=[];
			response.files.forEach(function(file){
				message += (file.basename+ '\n');
				uploaded_files.push(file.server_path);
			});
			message += "upload successfully.";
			__update_message_and_progressbar(message,"green",20,-1);
			__import_tested_result(trid,
								   user_id,
								   uploaded_files);
		}
		else{
			__update_message_and_progressbar(response.message,"red",20,6000);
		}     
	},
	function(response){
		var message = "Failed to upload file(s)"+"\n"+response.message;
		__update_message_and_progressbar(message,"red",20,6000);
	});
}

function __import_tested_result(trid,user_id,files){
	$.ajax({
		url: 'php/testrun_management.php',
		type: 'POST',
		dataType: 'json',
		data: {
			"action":"import_tested_result",
			"trid":trid,
			"user_id":user_id,
			"files":files,
		},
		success: function(response) {
			if(response.result=="Pass"){				
				if(response.modified_list && response.modified_list.length>0){
					message="Updated testcases:\n";
					for(index in response.modified_list ){
						var tc = response.modified_list[index];
						message+="\t"+tc.submit_result+",\t"+tc.ID+",\t"+tc.Verdict+"\n";
					}
					__update_message_and_progressbar(message,"green",100,-1);
				}
				else{
					message="All testcases are checked, nothing is changed.";
					__update_message_and_progressbar(message,"green",100,3000);
				}				
			}
			else{
				__update_message_and_progressbar(response.message,"red",50,6000);
			}
		},
		fail:function(response){
			var message = "Fail to export testrun;\n"+response;
			__update_message_and_progressbar(message,"red",50,6000);
		}
	});
}

function __check_permissions(){
	var tr_owner = $("#testrun_list :selected").attr("owner");
	var permission = $("#data_user_permission").val();

	// ***************** Default values *****************
	$("#add_tc_trs_files").attr("disabled","true");
	$("#btn_modify_tr_finished").attr("disabled","true");
	$("#btn_tr_delete").attr("disabled","true");
	$("#btn_add_tcs_start").attr("disabled","true");
	$("#div_tr_finished").attr("hidden","true");

	// ***************** Default values *****************

	if((tr_owner && tr_owner==$("#data_uid").val())||permission==9) {
		//$("#btn_upload_trs_popup").removeAttr("disabled");
		$("#add_tc_trs_files").removeAttr("disabled");		
		$("#btn_tr_delete").removeAttr("disabled");
		$("#btn_add_tcs_start").removeAttr("disabled");
		$("#btn_modify_tr_finished").removeAttr("disabled");
		var is_tr_active = $("#testrun_list :selected").attr("active")==1;		
		if(is_tr_active){
			$("#div_tr_finished").removeAttr("hidden");
		}
	}
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

function __establish_download_link_from_byte64_data(b64Data,file_name,contentType="octet/stream"){
	var a = document.createElement("a");
	document.body.appendChild(a);
	var blob = __b64toBlob(b64Data,512,"application/x-xls");
    var url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = file_name;
    a.click();
    window.URL.revokeObjectURL(url);
}

function __b64toBlob(b64Data,sliceSize,contentType="octet/stream") {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;
  var byteCharacters = atob(b64Data);
  var byteArrays = [];
  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);
    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    var byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  var blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

function __upload_trs_files(trid,files,succ_callback,fail_callback=null){
	var form_data = new FormData();
    form_data.append('action',"upload_trs_file");
    form_data.append("trid",trid);
    $.each(files,function(i,file){
        form_data.append("files[]",file);
    });
    $.ajax({
        url: "php/testrun_management.php",
        dataType: 'json',
        cache: false,
        contentType: false,
        processData: false,
        data: form_data, 
        type: 'post',
        success: succ_callback,
        fail: fail_callback
    });
}

function __upload_test_result_files(trid,files,succ_callback,fail_callback=null){
	var form_data = new FormData();
    form_data.append('action',"upload_tested_result_files");
    form_data.append("trid",trid);
    $.each(files,function(i,file){
        form_data.append("files[]",file);
    });
    $.ajax({
        url: "php/testrun_management.php",
        dataType: 'json',
        cache: false,
        contentType: false,
        processData: false,
        data: form_data, 
        type: 'post',
        success: succ_callback,
        fail: fail_callback
    });
}

function __clear_up_modal_upload_files(){
	$("#upload_files").val("");
	$("#upload_files").html("");
	$("#response_msg").html("");
}

function __check_export_testrun(){
	var is_ok = true;
	var message ="";
	var trid = $("#testrun_list").val();
	var export_trs_file=$("#export_trs_file").val();
	//alert("["+trid+"] : {"+export_trs_file+"}");
	if(!(is_ok&=(trid>=0))){message+="請選擇TestRun\n";}
	if(!(is_ok&=(export_trs_file!="NULL"))){message+="請選擇匯出檔案(TRS)\n";}
	if(is_ok){
		//Auto check all verdicts if there is not any verdict filter checkbox had checked.
		if($("input[name=ckb_export_trs_verdicts]:checked").length==0){
			$("#btn_export_trs_verdict_ALL").click();
		}
	}
	else{
		__update_message_and_progressbar(message,"red");
	}
	return is_ok;
}

function __check_insert_testcase(){
	var is_ok = true;
	var message ="";
	var trid = $("#testrun_list").val();
	var file_count = $("#add_tc_trs_files").prop("files").length;
	if(!(trid>=0)){message+="請選擇TestRun\n";is_ok=false;}
	if(!(file_count>0)){message+="請選擇匯入檔案(TRS)\n";is_ok=false;}
	if(is_ok){

	}
	else{
		__update_message_and_progressbar(message,"red");
		//alert(message);
	}
	return is_ok;
}

function __check_import_tested_result(){
	var is_ok = true;
	var message ="";
	var trid = $("#testrun_list").val();
	var uid = $("#data_uid").val();
	var file_count = $("#import_verdict_files").prop("files").length;
	if(!(trid>=0)){message+="請選擇TestRun\n";is_ok=false;}
	if(!(uid>=0)){message+="無效的使用者\n";is_ok=false;}
	if(!(file_count>0)){message+="請匯入檔案\n";is_ok=false;}
	if(is_ok){

	}
	else{
		__update_message_and_progressbar(message,'red');
	}
	return is_ok;
}

function __update_message_and_progressbar(message,color='black',progress=-1,display_time=3000){
	$("#response_msg").css("color",color);	
	$("#response_msg").html(htmlEncode(message));
	if(progress>=0){
		$(".progress").attr("hidden",null);
		$("#progress_bar").css("width",progress+"%");
	}
	else{
		$(".progress").attr("hidden",true);
		$("#progress_bar").css("width","0%");
	}
    if(display_time>=0){
        setTimeout(function() {
            //Clear message and progressbar
            $('#response_msg').css('color',"black");
            $("#response_msg").html("");
            $("#progress_bar").css("width",0+"%");
            $(".progress").attr("hidden","true");
        },display_time);
    }
}

function __testrun_finished_state_changed(active){
	if(active<0){
		$("#txt_tr_finished_state").css("background-color","white");
		$("#txt_tr_finished_state").html("Unknown");	
	}
	else if(active==0){
		$("#txt_tr_finished_state").css("background-color","skyblue");
		$("#txt_tr_finished_state").html("Finished");
	}
	else{
		$("#txt_tr_finished_state").css("background-color","lightgreen");
		$("#txt_tr_finished_state").html("Active");
	}
}

function __init(){
	$("#btn_upload_trs_popup").attr("disabled","true");
	$("#add_tc_trs_files").attr("disabled","true");
	$("#btn_modify_tr_finished").attr("disabled","true");
	$("#btn_tr_delete").attr("disabled","true");
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

$(document).ready(function(){
	__init();
	var myJson;
	//***************** get_testrun_list ************************
	get_testrun_list();
	//***************** get_active_users ************************
	get_active_users();
	//***************** export_testrun ************************
	$("#btn_export_trs_start").click(function(){
		if(__check_export_testrun()) {
			var trid = $("#testrun_list").val();
			var base_file = $("#export_trs_file").val();
			var tester_filter_id = $("#export_trs_filter_tester").val();
			var doc = $("#document_list").val();
			var verdicts = (function(){
				var ary = [];
				$("input[name='ckb_export_trs_verdicts']:checked").each(function(){
					ary.push($(this).val());
				});
				return ary;								
			}());
			export_testrun(trid,base_file,tester_filter_id,doc,verdicts);
		}
	});

	$("#btn_export_trs_verdict_ALL").click(function(){
		var is_all_checked = $("input[name=ckb_export_trs_verdicts]:checked").length == $('input[name=ckb_export_trs_verdicts]').length;
		$('input[name=ckb_export_trs_verdicts]').prop('checked',!is_all_checked);
	});

	$("#testrun_list").change(function(){
		if(trid = $("#testrun_list").val()){
			get_tr_documents(trid);
			find_tr_trs_files(trid);
		}
		if(trid>=0){
			$("#btn_upload_trs_popup").removeAttr("disabled");
			// $("#add_tc_trs_files").attr("disabled",null);
			// $("#btn_modify_tr_finished").attr("disabled",null);
			// $("#btn_tr_delete").attr("disabled",null);
			var active = $("#testrun_list :selected").attr("active");
			__testrun_finished_state_changed(active);	
		}
		else{
			$("#btn_upload_trs_popup").attr("disabled","true");
			$("#add_tc_trs_files").attr("disabled","true");
			$("#btn_modify_tr_finished").attr("disabled","true");
			$("#btn_tr_delete").attr("disabled","true");
			__testrun_finished_state_changed(-1);
		}
		__check_permissions();
	});

	// $("#btn_upload_files").click(function(){
	// 	var trid = $("#testrun_list").val();
	// 	var files = Object.values($("#upload_files").prop("files"));
	// 	upload_trs_files_for_export(trid,files);		
	// });

	$("#btn_upload_trs_popup").click(function(){
		__clear_up_modal_upload_files();
		$("#btn_upload_files").unbind('click');
		$("#btn_upload_files").bind('click',upload_trs_clicked);

		function upload_trs_clicked(){
			var trid = $("#testrun_list").val();
			var files = Object.values($("#upload_files").prop("files"));
			upload_trs_files_for_export(trid,files);		
		}	
	});



	$("#btn_add_tcs_start").click(function(){
		if(__check_insert_testcase()){
			var trid = $("#testrun_list").val();
			var files = Object.values($("#add_tc_trs_files").prop("files"));
			upload_trs_files_for_add_testcases(trid,files);	
		}
	});

	$("#btn_modify_tr_finished").click(function(){
		var active = $("#testrun_list :selected").attr("active");
		var target;
		var current_state="";
		var target_state="";
		if(active==0){
			current_state="Finished";
			target_state="Active";
			target=1;
		}
		else{
			current_state="Active";
			target_state="Finished";
			target=0;
		}
		var r = confirm(current_state+" ==> "+target_state+"\n確定變更?");
	    if (r == true) {
	        testrun_active_state_change($("#testrun_list").val(),target);
	    }
	});

	$("#btn_tr_delete").click(function(){
		var r = confirm("資料刪除後無法復原！\n確定要刪除TestRun?");
		if(r==true){
			delete_testrun($("#testrun_list").val());
		}
	});

	$("#ckb_show_inactive_tr").change(function(){		
		__show_inactive_testruns();
	});

	$("#btn_import_verdict").click(function(){
		if(__check_import_tested_result()){
			var trid = $("#testrun_list").val();
			var uid = $("#data_uid").val();
			var files = Object.values($("#import_verdict_files").prop("files"));
			import_tested_result(trid,uid,files);
		}
	});
});