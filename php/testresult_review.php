<?php
include __DIR__."/settings.php";
require_once __DIR__ ."/common_lib.php";

function search_testresult_by_trid_tcid(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['search_testresult_trids']) || isset($_POST['search_testresult_tcids'])){
		//Get filter fields
		$trids = isset($_POST['search_testresult_trids'])?$_POST['search_testresult_trids']:null;
		$tcids = isset($_POST['search_testresult_tcids'])?$_POST['search_testresult_tcids']:null;
		$verdicts = isset($_POST['search_testresult_verdicts'])?$_POST['search_testresult_verdicts']:null;
		$comments = isset($_POST['search_testresult_comments'])?$_POST['search_testresult_comments']:null;
		$conn = db_connect();
		//start db qurey			
		//*********************** SQL COMMAND ***********************
		$sql_cmd = __sql_cmd_search_testresult_by_trid_tcid($conn,$trids,$tcids,$verdicts,$comments);
		$result=$conn->query($sql_cmd);
		if ($result->num_rows > 0) {
			$__response_obj->result="Pass";
			$__response_obj->testresult=array();
			while($row = $result->fetch_assoc()){
				$tr = new stdClass();
				$tr->TrID = $row["TrID"];
				$tr->TcID = $row["TcID"];
				$tr->Verdict = $row["Verdict"];
				$tr->Comment = $row["Comment"];
				$tr->AttachmentLink=$row["AttachmentLink"];
				$tr->Tester = $row["FirstName"]."_".substr($row["LastName"],0,1);
				array_push($__response_obj->testresult,$tr);
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message='No data!';
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message='Parameters "search_testresult_trids" or "search_testresult_tcids" should be assigned';
	}
	return $__response_obj;
}


function __sql_cmd_search_testresult_by_trid_tcid($conn,$trids,$tcids,$verdicts=null,$comments=null){
	$sql_cmd="
		SELECT TrID,TcID,Verdict,`Comment`,AttachmentLink,FirstName,LastName
		FROM User,(
			SELECT `Usr_Exec_Tr_Tc`.TrID,`Usr_Exec_Tr_Tc`.TcID,Verdict,`Comment`,AttachmentLink,Submitter
			FROM `Usr_Exec_Tr_Tc`,(
				SELECT TrID,TcID,MAX(UpdatedTime) as LastUpdatedTime
				FROM `Usr_Exec_Tr_Tc` GROUP BY TrID,TcID
			) AS last_records
			WHERE `Usr_Exec_Tr_Tc`.TrID=last_records.TrID AND `Usr_Exec_Tr_Tc`.TcID=last_records.TcID AND `Usr_Exec_Tr_Tc`.UpdatedTime=last_records.LastUpdatedTime)AS LAST_VERDICTS
		WHERE Submitter=User.ID";
		if($trids && count($trids)>0){
			$condiction_trids=" AND(";
			foreach($trids as $trid){
				$condiction_trids.=sprintf("TrID=\"%s\"",$trid);
				$condiction_trids.=" OR ";
			}
			$condiction_trids = rtrim($condiction_trids," OR ");
			$condiction_trids.=")";
			$sql_cmd.= $condiction_trids;
		}
		if($tcids && count($tcids)>0){
			$condiction_tcids=" AND(";
			foreach($tcids as $tcid){
				$condiction_tcids.=sprintf("TcID like \"%%%s%%\"",
					$conn->real_escape_string($tcid));
				$condiction_tcids.=" OR ";
			}
			$condiction_tcids = rtrim($condiction_tcids," OR ");
			$condiction_tcids.=")";
			$sql_cmd.= $condiction_tcids;
		}
		if($verdicts && count($verdicts)>0){
			$condiction_trids=" AND(";
			foreach($verdicts as $verdict){
				$condiction_trids.=sprintf("Verdict=\"%s\"",$verdict);
				$condiction_trids.=" OR ";
			}
			$condiction_trids = rtrim($condiction_trids," OR ");
			$condiction_trids.=")";
			$sql_cmd.= $condiction_trids;
		}
		if($comments &&  count($comments)>0){
			$condiction_tcids=" AND(";
			foreach($comments as $comment){
				if($comment=="ALL"){
					$condiction_tcids.='`Comment` is not NULL AND `Comment`!=""';
					break;
				}
				else{
					$condiction_tcids.=sprintf("`Comment` like \"%%%s%%\"",
						$conn->real_escape_string($comment));
					$condiction_tcids.=" OR ";
				}
			}
			$condiction_tcids = rtrim($condiction_tcids," OR ");
			$condiction_tcids.=")";
			$sql_cmd.= $condiction_tcids;
		}
	write_log("__sql_cmd_search_testresult_by_trid_tcid",$sql_cmd);
	return $sql_cmd;
}

$response_obj=new stdClass();
if(isset($_POST['action'])){
	if($_POST['action']=="search_testresult_by_trid_tcid"){
		$response_obj = search_testresult_by_trid_tcid();
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