<?php
require_once __DIR__ ."/common_lib.php";

function get_all_users(){	
	$__response_obj=new stdClass();
	$__response_obj->action="get_all_users";
	$sql_cmd="SELECT * FROM `User`";
	$conn = db_connect();
	$result=$conn->query($sql_cmd);
	if ($result->num_rows > 0) {
		$__response_obj->result="Pass";
		$__response_obj->users=array();
		while($row = $result->fetch_assoc()) {
			$user = new stdClass();
			$user->ID=$row["ID"];
			$user->FirstName=$row["FirstName"];
			$user->LastName=$row["LastName"];
			$user->Active=$row['Active'];
			array_push($__response_obj->users,$user);
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message='No data!';
	}
	return $__response_obj;
}

function get_user_info(){	
	$__response_obj=new stdClass();
	$__response_obj->action="get_user_info";
	$conn = db_connect();
	if($_POST['uid']){
		$sql_cmd=__sqlcmd_get_user_info($conn,$_POST['uid']);
		$result=$conn->query($sql_cmd);
		if ($result->num_rows > 0) {
			$row = $result->fetch_assoc();		
			if($row["FirstName"]){
				$__response_obj->FirstName=$row["FirstName"];
			}
			if($row["LastName"]){
				$__response_obj->LastName=$row["LastName"];
			}
			if($row["Email"]){
				$__response_obj->Email=$row["Email"];
			}
			if($row["Permission"]){
				$__response_obj->Permission=$row["Permission"];
			}
			if($row["Active"]!=null){
				$__response_obj->Active=$row["Active"];
			}
			$__response_obj->result="Pass";		
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message="Fail to get user info";
		}
	}
	else{
		$__response_obj->result='Fail';
		$__response_obj->message='Invalid parameters';
	}
	$conn->close();
	return $__response_obj;
}

function set_user_info(){
	$__response_obj=new stdClass();
	$__response_obj->action="set_user_info";
	$conn = db_connect();
	if($_POST['uid'] && $_POST['user_info']){
		$sql_cmd = __sqlcmd_set_user_info($conn,$_POST['uid'],$_POST['user_info']);
		$result=$conn->query($sql_cmd);
		if ($result) {
			$__response_obj->result='Pass';
		}
	}
	else{
		$__response_obj->result='Fail';
		$__response_obj->message='Invalid parameters';
	}
	$conn->close();
	return $__response_obj;
}

function change_user_password(){	
	$__response_obj=new stdClass();
	$__response_obj->action="change_user_password";
	$conn = db_connect();
	if($_POST['uid'] && $_POST['new_password']){
		$uid = $_POST['uid'];
		$new_password = $_POST['new_password'];
		$current_password = $_POST['current_password']?$_POST['current_password']:null;
		$sql_cmd=__sqlcmd_get_user_info($conn,$uid);
		$result=$conn->query($sql_cmd);
		if ($result->num_rows > 0) {
			$row = $result->fetch_assoc();
			if($row["Password"]==null || $row["Password"]==$current_password){
				$sql_cmd=__sqlcmd_set_user_info($conn,$uid,['Password'=>$new_password]);
				$result=$conn->query($sql_cmd);
				if($result){
					$__response_obj->result="Pass";
				}
				else{
					$__response_obj->result="Fail";
					$__response_obj->message="Failed to change password, error message: \n".$conn->error;	
				}
			}
			else{
				$__response_obj->result="Fail";
				$__response_obj->message="Current password is incorrect.";			
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message="Fail to get user info";
		}
	}
	else{
		$__response_obj->result='Fail';
		$__response_obj->message='Invalid parameters';
	}
	$conn->close();
	return $__response_obj;
}

function create_new_user(){
	$__response_obj=new stdClass();
	$__response_obj->action="create_new_user";
	$conn = db_connect();
	if($_POST['email'] && $_POST['fname'] && $_POST['lname'] && $_POST['role']){
		$sql_cmd = __sqlcmd_create_new_user($conn,$_POST['email'],$_POST['fname'],$_POST['lname'],$_POST['role']);
		$result=$conn->query($sql_cmd);
		if($result){
			$__response_obj->result="Pass";			
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message="Failed to create new user, error message: \n".$conn->error;	
		}
	}
	else{
		$__response_obj->result='Fail';
		$__response_obj->message='Invalid parameters';
	}
	$conn->close();
	return $__response_obj;
}

function __sqlcmd_get_user_info($conn,$uid){
	$sql_cmd = sprintf(
		"SELECT * FROM `User` WHERE `ID` = '%s'",
		$conn->real_escape_string($uid)
	);
	return $sql_cmd;
}

function __sqlcmd_set_user_info($conn,$uid,$user_info){
	$sql_cmd = "UPDATE `User` SET ";
	$cols_vals='';
	foreach ($user_info as $key => $value){
		if($cols_vals and strlen($cols_vals)>0){
			$cols_vals.=", ";
		}
		$cols_vals.=(sprintf("`%s`=\"%s\"",
			$conn->real_escape_string($key),
			$conn->real_escape_string($value)
			));
		}
	$sql_cmd.=$cols_vals;
	$sql_cmd.= sprintf(" WHERE ID=\"%s\"",$uid);
	return $sql_cmd;
}

function __sqlcmd_create_new_user($conn,$email,$fname,$lname,$role){
	$sql_cmd = sprintf("Insert into User(Email,FirstName,LastName,Permission) Values(\"%s\",\"%s\",\"%s\",\"%s\")",
		$conn->real_escape_string($email),
		$conn->real_escape_string($fname),
		$conn->real_escape_string($lname),
		$conn->real_escape_string($role));
	return $sql_cmd;
}

$response_obj=new stdClass();
if(isset($_POST['action'])){
	if($_POST['action'] =="get_user_info"){
		$response_obj = get_user_info();
	}
	else if($_POST['action'] =="set_user_info"){
		$response_obj = set_user_info();
	}
	else if($_POST['action'] =="change_user_password"){
		$response_obj = change_user_password();
	}
	else if($_POST['action'] =="create_new_user"){
		$response_obj = create_new_user();
	}
	else if($_POST['action'] =="get_all_users"){
		$response_obj = get_all_users();
	}
	
	else{
		$response_obj->result="Fail";
		$response_obj->message="Action does NOT defined.";
	}
}
else{
	$response_obj->action="UNKNOWN";
	$response_obj->result="Fail";
	$response_obj->message="Invalid command.";			
}
$strResult = json_encode($response_obj);
echo $strResult;
?>