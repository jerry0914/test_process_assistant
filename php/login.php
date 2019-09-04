<?php
require_once __DIR__ ."/common_lib.php";
function login($user_name,$password){
	//file_put_contents('php://stderr', print_r("Enter into login function."."\n", TRUE)); //************Debug**********
	$conn = db_connect();
	$sql_cmd = sprintf(
		"SELECT * FROM `User` WHERE `Email` = '%s'",// and `Password` = '%s'",
		$conn->real_escape_string($user_name)
		//,$conn->real_escape_string($password)
	);
	$result=$conn->query($sql_cmd);
	$response_obj=new stdClass();
	if ($result->num_rows > 0) {
		$row = $result->fetch_assoc();
		$response_obj->action="login";
		$response_obj->ID=$row["ID"];
		$response_obj->FirstName=$row["FirstName"];
		$response_obj->LastName=$row["LastName"];
		$response_obj->Active=$row["Active"];
		$response_obj->Email=$row["Email"];
		$response_obj->Password=$row["Password"];
		$response_obj->Permission=$row["Permission"];
		if(($response_obj->ID!=null) &&
		   ($response_obj->Password==null || $response_obj->Password==$password) &&
		   ($response_obj->Active>=1)
		   ){
		   	session_start();
			$_SESSION['user_id'] = $response_obj->ID;
			//$_SESSION['user_name'] = $response_obj->FirstName." ".$response_obj->LastName;
			//$_SESSION['user_email']=$response_obj->Email;
			$_SESSION['user_permission']=$response_obj->Permission; 
			//$return_msg="{'result':'Pass','message':'Hello, ".$response_obj->FirstName."'}";
			$response_obj->result="Pass";
			unset($response_obj->Password);
		}
		else{
			//$return_msg="{'result':'Fail','message':'Invalid Account or Password!'}";
			$response_obj->result="Fail";
		}
	}
	else{
		$response_obj->result="Fail";
	}
	$conn->close();
	$strResult = json_encode($response_obj);
	//file_put_contents('php://stderr', print_r($strResult."\n", TRUE)); //************Debug**********
	echo $strResult;
}

function logout(){
	$response_obj=new stdClass();
	session_start();
	if($_SESSION['user_id']){
		unset($_SESSION['user_id']);
	}
	session_unset();
	$response_obj->result="Pass";
	$response_obj->action="logout";
	$strResult = json_encode($response_obj);
	//file_put_contents('php://stderr', print_r($strResult."\n", TRUE)); //************Debug**********
	echo $strResult;
}

if(isset($_POST['action']) && $_POST['action']=="logout"){
	logout();	
}
else{
	if (isset($_POST['user_account'])){
		login($_POST["user_account"],$_POST["user_password"]);
	}
}
?>