function create_testrun(){
    // input fields pre-check
    var message="";
    var pre_check_ok=true;
    var testrun_name = $("#testrun_name").val();
    if(testrun_name && testrun_name.length>0){       
    }
    else{
        pre_check_ok =false;
        message+="請輸入TestRun名稱\n";
    }
    var file_count = $("#trs_files").prop("files").length;
    if(file_count>0){
    }
    else{
        pre_check_ok =false;
        message+="請選擇TRS檔案\n";
    }
    if(pre_check_ok){
        __check_testrun_existance(testrun_name);
    }
    else{
        // $("#response_msg").css("color","red");
        // $("#response_msg").html(message);
         __update_message_and_progressbar(message,"red",0,6000);
    }
}

function __check_testrun_existance(tr_name){
     $.ajax({
        url: "php/testrun_management.php",
        type: 'post',
        dataType: 'json',
        data: {
            "action":"is_testrun_exist",
            "tr_name":tr_name,
        },
        success: function(response){
            if(response.result=="Pass"){
                var is_exist = !(response.is_exist=="0");
                if(is_exist){
                    // $("#response_msg").css("color","red");
                    // $("#response_msg").html("TestRun已存在");
                    __update_message_and_progressbar("TestRun已存在","red",5,6000);               
                }
                else{
                    __update_message_and_progressbar("","green",5);
                    __create_testrun(tr_name);
                }
            }
            else{
                // $("#response_msg").css("color","red");
                // $("#response_msg").html(response.message);
                __update_message_and_progressbar(response.message,"red",5,6000);
            }    
        }
    });   
}

function __create_testrun(tr_name){
    var user_id=$("#data_uid").val();
    var trid=-1;
    $.ajax({
        url: 'php/testrun_management.php',
        type: 'POST',
        dataType: 'json',
        data: {
            "action":"create_testrun",
            "tr_name":tr_name,
            "user_id":user_id
        },
        success: function(response){
            if(response.result=="Pass"){
                var ary_files = Object.values($("#trs_files").prop("files"));
                var message = "TestRun \""+tr_name+"\" created.";
                // $("#response_msg").css("color","green");
                // $("#response_msg").html(message);
                __update_message_and_progressbar(message,"green",10);
                upload_trs_files(response.trid,ary_files);
            }
            else{
                // $("#response_msg").css("color","red");
                // $("#response_msg").html(response.message);
                __update_message_and_progressbar(response.message,"red",10,6000);
            }            
        }
    });
}

function upload_trs_files(trid,files){
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
        success: function(response){
            if(response.result=="Pass"){
                var message ="";
                var trs_files=[];
                response.files.forEach(function(file){
                    message += (file.basename+ ";\n ");
                    trs_files.push(file.server_path);
                });
                message += "upload successfully.";
                // $("#response_msg").css("color","black");
                // $("#response_msg").html(message);
                __update_message_and_progressbar(message,"green",40);
                add_testcase_to_testrun(trid,
                                        trs_files,
                                        $("#ckb_tc_automated_update").prop("checked"),
                                        $("#ckb_tc_tag_update").prop("checked"));               
            }
            else{
                // $("#response_msg").css("color","red");
                // $("#response_msg").html(response.message);
                __update_message_and_progressbar(response.message,"green",40,6000);
            }       
        }
    });
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
                // $("#response_msg").css("color","green");
                var message = "Done! Add "+response.tc_count+" testcase(s) into "+ $("#testrun_name").val();
                // $("#response_msg").html(message);
                __update_message_and_progressbar(message,"green",100,6000);
            }
            else{
                // $("#response_msg").css("color","red");
                // $("#response_msg").html(response.message);
                __update_message_and_progressbar(message,"red",50,6000);
            }    
        }
    });
}

function __update_message_and_progressbar(message,color,progress,display_time=-1){
    $("#response_msg").css("color",color);
    $("#response_msg").html(htmlEncode(message));
    $(".progress").attr("hidden",null);
    $("#progress_bar").css("width",progress+"%");
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

$(document).ready(function() {
    $("#btn_trs_create").click(function(){
        create_testrun();  
    });
});