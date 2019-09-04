<?php
require_once __DIR__."/common_lib.php";
include __DIR__."/settings.php";


function query_all_testing_productivity(){
    $__response_obj = new stdClass();
    $__response_obj->action=$_POST['action'];
    if(isset($_POST['begin_day']) && isset($_POST['end_day'])){
		//Get filter fields
        $conn = db_connect();
        //start db qurey			
        //*********************** SQL COMMAND ***********************
        $sql_cmd = __sqlcmd_query_all_testing_productivity($conn,$_POST['begin_day'],$_POST['end_day']);
        $result=$conn->query($sql_cmd);
        if ($result->num_rows > 0) {
            $__response_obj->result="Pass";
            $__response_obj->testing_productivity=array();
            while($row = $result->fetch_assoc()){
                $to = new stdClass();
				$to->UID = $row["UID"];
				$to->UserName = $row["user_name"];
				$to->Output = $row["output"];
				array_push($__response_obj->testing_productivity,$to);
            }
        }
        else{
            $__response_obj->result="Fail";
            $__response_obj->message='No data!';
            $__response_obj->sql_cmd=$sql_cmd;
        }
    }
    else{
        $__response_obj->result="Fail";
        $__response_obj->message='Parameters "begin_day" and "end_day" should be assigned';
    }
    return $__response_obj;
}

function query_individual_testing_productivity(){
    $__response_obj = new stdClass();
    $__response_obj->action=$_POST['action'];
    if(isset($_POST['begin_day']) && isset($_POST['end_day']) && isset($_POST['uid'])){
		//Get filter fields
        $conn = db_connect();
        //start db qurey			
        //*********************** SQL COMMAND ***********************
        $sql_cmd = __sqlcmd_query_individual_user_ouput($conn,$_POST['begin_day'],$_POST['end_day'],$_POST['uid']);
        $result=$conn->query($sql_cmd);
        if ($result->num_rows > 0) {
            $__response_obj->result="Pass";
            $__response_obj->testing_productivity=array();
            while($row = $result->fetch_assoc()){
                $to = new stdClass();
				$to->TrName = $row["Name"];
				$to->Output = $row["Output"];
				array_push($__response_obj->testing_productivity,$to);
            }
        }
        else{
            $__response_obj->result="Fail";
            $__response_obj->message='No data!';
            $__response_obj->sql_cmd=$sql_cmd;
        }
    }
    else{
        $__response_obj->result="Fail";
        $__response_obj->message='Parameters "begin_day","end_day", and "uid" should be assigned';
    }
    return $__response_obj;
}

function __sqlcmd_query_all_testing_productivity($conn,$begin_day,$end_day){
     
    $sql_cmd=sprintf("Select User.ID as UID,concat(User.FirstName,' ',User.LastName) as user_name,output
        FROM User,
        (SELECT Submitter,Count(*) as output
        FROM
        (SELECT TrID,Submitter FROM Usr_Exec_Tr_Tc Where UpdatedTime between '%s' and '%s'
        Group by TrID,TcID,Submitter) as last_records_by_test
        Group by Submitter) as personal_output
        WHERE User.ID = personal_output.submitter",
        $conn->real_escape_string($begin_day),
        $conn->real_escape_string($end_day)
    );
    return $sql_cmd;
}


function __sqlcmd_query_individual_user_ouput($conn,$begin_day,$end_day,$uid){
    $sql_cmd=sprintf("Select TestRun.Name,Output
        FROM TestRun,
        (SELECT TrID,Submitter,Count(*) as Output
        FROM
        (SELECT TrID,Submitter FROM Usr_Exec_Tr_Tc Where UpdatedTime between '%s' and '%s' and Submitter='%s'
        Group by TrID,TcID,Submitter) as last_records_by_test
        Group by TrID,Submitter) as personal_output
        WHERE TestRun.ID=personal_output.TrID",
        $conn->real_escape_string($begin_day),
        $conn->real_escape_string($end_day),
        $conn->real_escape_string($uid)
    );
    return $sql_cmd;
}

$response_obj=new stdClass();
if(isset($_POST['action'])) {
    if($_POST['action'] == 'query_all_testing_productivity'){
		$response_obj = query_all_testing_productivity();				
    }
    else if($_POST['action'] == 'query_individual_testing_productivity'){
		$response_obj = query_individual_testing_productivity();				
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
//file_put_contents('php://stderr', print_r($strResult."\n", TRUE)); //************Debug**********
echo $strResult;
?>