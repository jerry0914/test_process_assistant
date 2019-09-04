<?php
require_once __DIR__ ."/common_lib.php";
$response_obj=new stdClass();
session_start();
if(isset($_SESSION['user_id'])){
	//file_put_contents('php://stderr', print_r("isvaliduser: userid=".$_SESSION['user_id']."\n", TRUE)); //************Debug**********
	$conn = db_connect();
	$sql_cmd = sprintf(
		"SELECT FirstName,LastName,Active,Permission FROM `User` WHERE `ID` = '%s'",
		$conn->real_escape_string($_SESSION['user_id'])
	);
	$result=$conn->query($sql_cmd);
	$response_obj=new stdClass();
	$response_obj->action="isvaliduser";
	if ($result->num_rows > 0) {
		$row = $result->fetch_assoc();
		$response_obj->ID=$_SESSION['user_id'];
		$response_obj->FirstName=$row["FirstName"];
		$response_obj->LastName=$row["LastName"];
		$response_obj->Active=$row["Active"];
		$response_obj->Permission=$row["Permission"];
		if($response_obj->Active>0){
			$response_obj->result="Pass";
		}
		else{
			$response_obj->result="Fail";
			unset($response_obj->ID);
			unset($response_obj->FirstName);
			unset($response_obj->LastName);
			unset($response_obj->Active);
			unset($response_obj->Permission);
		}
	}
	else{
		$response_obj->result="Fail";
	}
	$conn->close();
}
else{
	//file_put_contents('php://stderr', print_r("isvaliduser: No user_id SESSION"."\n", TRUE)); //************Debug**********
	$response_obj->result="Fail";
}
$strResult = json_encode($response_obj);
//file_put_contents('php://stderr', print_r($strResult."\n", TRUE)); //************Debug**********
echo $strResult;
?>