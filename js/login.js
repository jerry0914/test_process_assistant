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

function show_user_permission(response){
	//Initialize	
	$("#nav_link_testrun").attr("hidden","true")
	$("#nav_link_testmanagement").attr("hidden","true");
	$("#nav_link_testrun_import").attr("hidden","true");
	$("#nav_link_testrun_management").attr("hidden","true");
	$("#nav_link_testresult_review").attr("hidden","true");
	$("#nav_link_testing_productivity").attr("hidden","true");
	$("#nav_link_admin").attr("hidden","true");
	$("#nav_link_testrun").attr("href","#")
	$("#nav_link_testmanagement").attr("href","#");
	$("#nav_link_testmanagement").removeClass("dropdown-toggle");
	$("#nav_link_testmanagement").removeAttr("data-toggle");
	$("#nav_link_testrun_import").attr("href","#");
	$("#nav_link_testrun_management").attr("href","#");
	$("#nav_link_testresult_review").attr("href","#");
	$("#nav_link_testing_productivity").attr("href","#");
	$("#nav_link_admin").attr("hidden","true");
	$("#edit_user_info").attr("hidden","true");
	$("#change_user_password").attr("hidden","true");
	if(response.result=="Pass"){
		//Login or check isavaliduser
		if(response.action=="login" || response.action=="isvaliduser"){
			//===== NavItem Login =====
			show_user_name_on_login_area(response.FirstName,response.LastName);
			//ST members
			if(response.Permission>=2){
				//===== NavLink TestManagement =====
				$("#nav_link_testmanagement").removeAttr("hidden");
				$("#nav_link_testmanagement").attr("href","./testrun_management.html");
			}
			//Regular users
			if(response.Permission>=1){ 
				//NavLink Home
				$("#nav_link_home").removeAttr("hidden");
				//===== NavLink TestRun =====
				$("#nav_link_testrun").removeAttr("hidden");
				$("#nav_link_testrun").attr("href","./testrun_selector.html");				
			}
			//Guest
			else{
				//NavLink Home
				$("#nav_link_home").attr("hidden","true");
				//===== NavLink TestRun =====
				$("#nav_link_testrun").attr("hidden","true");			
				$("#nav_link_testrun").attr("href","#");
				//===== NavLink TestManagement =====
				$("#nav_link_testmanagement").attr("hidden","true");
				$("#nav_link_testmanagement").attr("href","#");
				//===== NavLink TestRun_Management =====
				$("#nav_link_testrun_management").attr("hidden","true");
				$("#nav_link_testresult_review").attr("hidden","true");
				$("#nav_link_testing_productivity").attr("hidden","true");			
			}
			//===== NavItem TestRun_Import =====
			//Test leaders and administrators 
			if(response.Permission==3 || response.Permission==9 || response.Permission==15){
				//===== NavLink TestManagement =====
				$("#nav_link_testmanagement").attr("href","#");
				$("#nav_link_testmanagement").addClass("dropdown-toggle");
				$("#nav_link_testmanagement").attr("data-toggle","dropdown");
				//===== NavLink TestRun_Management =====
				$("#nav_link_testrun_management").removeAttr("hidden");
				$("#nav_link_testrun_management").attr("href","./testrun_management.html");	
				//===== NavLink TestManagement =====
				$("#nav_link_testrun_import").removeAttr("hidden");
				$("#nav_link_testrun_import").attr("href","./testrun_import.html");
				
				//Test Result Review
				$("#nav_link_testresult_review").removeAttr("hidden");
				$("#nav_link_testresult_review").attr("href","./testresult_review.html");
				if (response.ID!=3){
					//Testing productivity
					$("#nav_link_testing_productivity").removeAttr("hidden");
					$("#nav_link_testing_productivity").attr("href","./testing_productivity.html");
				}								
			}
			else{
				$("#nav_link_testrun_import").attr("hidden","true");
				$("#nav_link_testrun_import").attr("href","#");
			}
			//===== NavItem Administration =====
			if(response.Permission==9){
				$("#nav_link_admin").removeAttr("hidden");
			}
			else{
				$("#nav_link_admin").attr("hidden","true");
			}

			//************** Store user data **************
			$("#data_uid").val(response.ID);
			$("#data_user_permission").val(response.Permission);

			//************** __testrun_management_customize_by_user_permission  **************
			if($(location).attr('href').endsWith("testrun_management.html")){
				__testrun_management_customize_by_user_permission(response.Permission);
			}
		}
		//Logout
		else if(response.action=="logout"){
			$("#login_msg").html("");
			$("#dropdownMenu_login").html("Login");
			$("#dropdownMenu_login").css("color","");
			$("#div_user_account").attr("hidden",null);
			$("#user_account").val("");
			$("#user_password").attr("type","password");
			$("#btn_login").html("Login");
			$("#btn_login").attr("action","login");
			//$("#forget_pwd_link").css("display","");
			//NavItem Home
			$("#nav_link_home").attr("hidden","true");
			//===== NavItem TestRun =====
			$("#nav_link_testrun").attr("hidden","true");
			$("#nav_link_testrun").attr("href","#");
			//===== NavItem Testmanagement =====
			$("#nav_link_testmanagement").attr("hidden","true");
			//===== NavItem Administration =====
			$("#nav_link_admin").attr("hidden","true");
			//************** Clean user data **************
			$("#data_uid").val('');
			if(!$(location).attr('href').endsWith("index.html")){
				window.location.replace("./index.html");
			}
			//************** Clean user data **************
			$("#data_uid").val('');
			$("#data_user_permission").val('');
		}
		__is_avalid_user_of_individual_page(response);	
	}
	//Fail to login
	else{
		$("#login_msg").html("Invalid Account or Password!");
		$("#login_msg").css("color","Red");
		$("#dropdownMenu_login").html("Login");
		$("#dropdownMenu_login").css("color","");
		$("#user_account").attr("type","text");
		$("#user_password").attr("type","password");
		$("#btn_login").html("Login");
		$("#btn_login").attr("action","login");
		//$("#forget_pwd_link").css("display","");
		//NavItem Home
		$("#nav_link_home").attr("hidden","true");
		//===== NavItem TestRun =====
		$("#nav_link_testrun").attr("hidden","true");
		$("#nav_link_testrun").attr("href","#");
		//===== NavItem Testmanagement =====
		$("#nav_link_testmanagement").attr("hidden","true");
		//===== NavItem Administration =====
		$("#nav_link_admin").attr("hidden","true");

		//************** Clean user data **************
		$("#data_uid").val('');
		$("#data_user_permission").val('');

		if(!$(location).attr('href').endsWith("index.html")){
			window.location.replace("./index.html");
		}
	}
}

function show_user_name_on_login_area(fname,lname)
{
	$("#login_msg").html("Welcome, "+fname+" "+lname);
	$("#login_msg").css("color","Green");					
	$("#dropdownMenu_login").html("Hi, "+fname);
	$("#dropdownMenu_login").css("color","yellow");
	$("#div_user_account").attr("hidden","true");
	$("#user_password").attr("type","hidden");	
	$("#btn_login").html("Logout");
	$("#btn_login").attr("action","logout");
	$("#edit_user_info").removeAttr("hidden");
	$("#change_user_password").removeAttr("hidden");
}

function __testrun_management_customize_by_user_permission(permission){
	if(permission==3 || permission==9){
		$("#add_tc_tab").removeAttr("hidden");
		$("#manage_tr_tab").removeAttr("hidden");	
	}
	else{
		$("#add_tc_tab").attr("hidden","true");
		$("#manage_tr_tab").attr("hidden","true");
	}
}

function __is_avalid_user_of_individual_page(response){
	var checked_result = false;
	if(response.Permission){
		var page_name = $(location).attr('href');
		var permission_require=99;
		if(
		   page_name.endsWith("testrun_selector.html") ||
		   page_name.endsWith("testrun.html"))
		{
		   permission_require=1;
		}
		else if(page_name.endsWith("testrun_management.html")){
			permission_require=2;
		}
		else if(
			page_name.endsWith("testresult_review.html") ||
			page_name.endsWith("testrun_import.html") ||
			page_name.endsWith("multiple_testrun_overview.html"))
		{
			permission_require =3;
		}
		else if(
			page_name.endsWith("administration.html") ||
			page_name.endsWith("user_management.html"))
		{
			permission_require=9;
		}
		checked_result = response.Permission>=permission_require;
		if(page_name.endsWith("testing_productivity.html")){
			checked_result = (response.Permission==9 || response.Permission==3 || response.Permission==15) && response.ID!=3;
		}
	}
	if(!checked_result){
		if(!$(location).attr('href').endsWith("index.html")){
			window.location.replace("./index.html");
		}
	}
}

function show_user_info(response){
	if(response.FirstName){
		$("#edit_user_info_fname").val(response.FirstName);
	}
	if(response.LastName){
		$("#edit_user_info_lname").val(response.LastName);
	}
	if(response.Email){
		$("#edit_user_info_email").val(response.Email.replace('@usiglobal.com',''));
	}
}

function send_req_get_user_info()
{
	$.ajax({
		url: 'php/user.php',
		type: 'POST',
		dataType: 'json',
		data: {
				"action":'get_user_info',			
				"uid":$('#data_uid').val()
		},
		success: function(response) {
			show_user_info(response);
		}
	});
}

function send_req_set_user_info(){
	var mydata={};
	if($("#edit_user_info_fname").val()){
		mydata.FirstName=$("#edit_user_info_fname").val()
	}
	if($("#edit_user_info_lname").val()){
		mydata.LastName=$("#edit_user_info_lname").val()
	}
	if($("#edit_user_info_email").val()){
		var email=$("#edit_user_info_email").val();
		if(!email.endsWith("@usiglobal.com")){
			email+='@usiglobal.com';
		}
		mydata.Email=email;
	}
	$.ajax({
		url: 'php/user.php',
		type: 'POST',
		dataType: 'json',
		data: {
				"action":'set_user_info',			
				"uid":$('#data_uid').val(),
				"user_info":mydata
		},
		success: function(response) {
			if(response.result=="Pass"){
				fname = mydata.FirstName?mydata.FirstName:"";
				lname = mydata.LastName?mydata.LastName:"";
				show_user_name_on_login_area(fname,lname);
			}
			else{
				alert(response.message);
			}			
		}
	});
}

function send_req_change_user_password(){
	if(__prerequisite_change_user_password()){
		var mydata={
			"action":'change_user_password',			
			"uid":$('#data_uid').val(),			
			"new_password":$("#change_user_password_new").val()
		};
		if($("#change_user_password_current").val()){
			mydata.current_password=$("#change_user_password_current").val();
		}
		$.ajax({
			url: 'php/user.php',
			type: 'POST',
			dataType: 'json',
			data:mydata,
			success: function(response) {
				if(response.result=="Pass"){
					$("#change_user_password_current").val('');
					$("#change_user_password_new").val('');
					$("#change_user_password_confirm").val('');
					__show_change_user_password_message(message="Your password is changed, please use your new password to login next time.",color='green',display_time=6000);
					setTimeout(function() {
						$("#modal_change_user_password").modal('hide');
					},6500);
				}
				else{
					__show_change_user_password_message(message=response.message,color='red',display_time=-1);
				}		
			}
		});		
	}
}

function __prerequisite_change_user_password(){
	var result=false;
	var all_fields_ready = true;
	// if(!$("#change_user_password_current").val()){
	// 	$("#change_user_password_current").css("background-color","lightpink");
	// 	$("#change_user_password_current").attr("placeholder","Enter your password.");
	// 	all_fields_ready=false;
	// }
	// else{
	// 	$("#change_user_password_current").css("background-color","");
	// 	$("#change_user_password_current").removeAttr("placeholder");
	// }
	if(!$("#change_user_password_new").val()){
		$("#change_user_password_new").css("background-color","lightpink");
		$("#change_user_password_new").attr("placeholder","Enter your new password.");
		all_fields_ready=false;
	}
	else{
		$("#change_user_password_new").css("background-color","");
		$("#change_user_password_new").removeAttr("placeholder");
	}
	if(!$("#change_user_password_confirm").val()){
		$("#change_user_password_confirm").css("background-color","lightpink");
		$("#change_user_password_confirm").attr("placeholder","Confirm your new password.");
		all_fields_ready=false;
	}
	else{
		$("#change_user_password_confirm").css("background-color","");
		$("#change_user_password_confirm").removeAttr("placeholder");
	}
	if(all_fields_ready){
		if($("#change_user_password_confirm").val() != $("#change_user_password_new").val()){
			all_fields_ready=false;
			__show_change_user_password_message(message="2 fields of new password does not match.",color='red',display_time=-1);
			$("#change_user_password_new").css("background-color","lightpink");
			$("#change_user_password_confirm").css("background-color","lightpink");
		}
	}
	return all_fields_ready;
}

function __show_change_user_password_message(message,color='black',display_time=5000){
	$("#change_user_password_message").css("color",color);	
	$("#change_user_password_message").html(htmlEncode(message));
	if(message){
		$("#change_user_password_message").removeAttr("hidden");
	}
	if(display_time>0){
        setTimeout(function() {
			$("#change_user_password_message").attr("hidden","true");
			$("#change_user_password_message").html("");
		},display_time);
    }
}

$(document).ready(function() {
	//*************** Check isvaliduser ***************
	var myJson;
	$.ajax({
		url: 'php/isvaliduser.php',
		type: 'POST',
		dataType: 'json',
		success: function(response) {
			show_user_permission(response);			
		}
	});
	//*************** Login ***************
	$("#btn_login").click(function(){
		var user_account = $("#user_account").val();
		if(!user_account.endsWith("@usiglobal.com")){
			user_account+='@usiglobal.com';
		}
		$.ajax({
			url: 'php/login.php',
			type: 'POST',
			dataType: 'json',
			data: {
					"action":$("#btn_login").attr("action"),			
					"user_account":user_account,
					"user_password":$("#user_password").val()
			},
			success: function(response) {
				show_user_permission(response);
			}
		});	
	});

	

	//*************** Edit user info ***************
	$("#btn_edit_user_info_ok").click(function(){
		send_req_set_user_info();
	});
	//*************** Edit user info ***************
	$("#btn_change_user_password_ok").click(function(){
		send_req_change_user_password();
	});
});
