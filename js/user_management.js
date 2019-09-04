function __check_create_user_fields(){
    var result = true;
    if($("#new_user_email").val()){
        $("#new_user_email").css('background-color','');
    }
    else{
        $("#new_user_email").css('background-color','pink');
        result=false;      
    }
    if($("#new_user_fname").val()){
        $("#new_user_fname").css('background-color','');
    }
    else{
        $("#new_user_fname").css('background-color','pink');
        result=false;   
    }
    if($("#new_user_lname").val()){
        $("#new_user_lname").css('background-color','');
    }
    else{
        $("#new_user_lname").css('background-color','pink');
        result=false;       
    }
    return result;
}

function get_all_users(){
    $("#all_users_list").html('');
    $.ajax({
        url: 'php/user.php',
        type: 'POST',
        dataType: 'json',
        data: {'action':'get_all_users'},
        success:function(response) {
            if(response.result=="Pass"){
                if(response.users && response.users.length>0){
                    for (index in response.users){
                        var user = response.users[index];
                        if(user.Active==1)
                        {
                            $("#all_users_list").append('<tr><td><font id='+user.ID+'>'+ user.FirstName+' ' + user.LastName+'</font></td><tr>');
                        }
                        else{
                            $("#all_users_list").append('<tr><td><font inactive id='+user.ID+'>'+ user.FirstName+' ' + user.LastName+'</font></td><tr>');
                        }                        
                    }
                }
                else{
                    $("#all_users_list").html('<tr><td>No DATA!!</td><tr>');
                }     
            }
            else{
                alert(response.message);
            }
        }
    });
}

function get_user_info(uid){
    $.ajax({
		url: 'php/user.php',
		type: 'POST',
		dataType: 'json',
		data: {
				"action":'get_user_info',			
				"uid":String(uid)
		},
		success: function(response) {
            if(response.result=="Pass"){
                if(response.FirstName){
                    $("#edit_user_fname").val(response.FirstName);
                }
                if(response.LastName){
                    $("#edit_user_lname").val(response.LastName);
                }
                if(response.Email){
                    var email = response.Email.replace('@usiglobal.com','');
                    $("#edit_user_email").val(email);
                }
                if(response.Permission){
                    $("#edit_user_role").val(response.Permission);
                }
                if(response.Active){
                    $("#edit_user_active").val(response.Active);
                }
            }
        }
	});
}

function set_user_info(uid){
    var user_info={};
    if($("#edit_user_fname").val()){
        user_info['FirstName']=$("#edit_user_fname").val();
    }
    if($("#edit_user_lname").val()){
        user_info['LastName']=$("#edit_user_lname").val();
    }
    if($("#edit_user_role").val()){
        user_info['Permission']=$("#edit_user_role").val();
    }
    if($("#edit_user_active").val()){
        user_info['Active']=$("#edit_user_active").val();
    }
    if($("#edit_user_email").val()){
        var email = $("#edit_user_email").val();
        if (!email.endsWith('@usiglobal.com')){
            email+='@usiglobal.com';
        }
        user_info['Email']=email;
    }
    $.ajax({
		url: 'php/user.php',
		type: 'POST',
        dataType: 'json',
        data:{"action":'set_user_info',			
              "uid":String(uid),
              "user_info":user_info
        },
		success: function(response) {
            if(response.result=="Pass"){
                alert("User info is updated.");
            }
            else{
                alert(response.message);
            }
        }
	});
}


function set_user_password(uid,password){
    var user_info={"Password":password};
    $.ajax({
		url: 'php/user.php',
		type: 'POST',
        dataType: 'json',
        data:{"action":'set_user_info',			
              "uid":String(uid),
              "user_info":user_info
        },
		success: function(response) {
            if(response.result=="Pass"){
                alert("User password is updated.");
            }
            else{
                alert(response.message);
            }
        }
	});
}


function create_new_user(){
    if(__check_create_user_fields()){
        var email=$("#new_user_email").val();
        if(!email.endsWith("@usiglobal.com")){
            email+='@usiglobal.com';
        }        
        var my_data = {"action":"create_new_user",
                        "email":email,
                        "fname":$("#new_user_fname").val(),
                        "lname":$("#new_user_lname").val(),
                        "role":$("#new_user_role").val()
        }
        $.ajax({
            url: 'php/user.php',
            type: 'POST',
            dataType: 'json',
            data: my_data,
            success:function(response) {
                if(response.result=="Pass"){
                    alert("New user: '"+email+"' is created.");
                }
                else{
                    alert(response.message);
                }
            }
        });
    }
    else{
        alert("Please fill up all fields of new user.")
    }
}

$(document).ready(function() {
    $("#btn_create_user").click(function(event){
		create_new_user();
    });
    
    $("#import_verdict_tab").click(function(event){
        get_all_users();
    });

    $('#btn_edit_user_OK').click(function(event){
        if($("#all_users_list [selected]>font").attr('id')){
            set_user_info($("#all_users_list [selected]>font").attr('id'));
        }
    });

    $('#btn_edit_user_change_password').click(function(event){
        if($("#all_users_list [selected]>font").attr('id') && $("#edit_user_password").val()){
            set_user_password($("#all_users_list [selected]>font").attr('id'),$("#edit_user_password").val());
        }
    });

    

    $("#all_users_list").on("click","tr>td>font",function(){
        $("#all_users_list [selected]").removeAttr('selected');        
        $(this).parent().attr('selected',true);
        var uid = $(this).attr('id');
        get_user_info(uid);
    }); 
      
});

