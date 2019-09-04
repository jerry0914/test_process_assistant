<?php
require_once __DIR__ ."/common_lib.php";

function set_tr_tc_filter(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['trid'])) {
		$trid=$_POST['trid'];
		session_start();
		$documents=isset($_POST['documents'])?$_POST['documents']:"";
		$verdicts=isset($_POST['verdicts'])?$_POST['verdicts']:"";
		$automated=isset($_POST['automated'])?$_POST['automated']:"";
		$tags=isset($_POST['tags'])?$_POST['tags']:"";
		$tr_name=isset($_POST['tr_name'])?$_POST['tr_name']:"";
		$_SESSION['tr_tc_list_action'] = "filter";
		$_SESSION['tr_tc_trid'] = $trid;
		$_SESSION['tr_tc_filter_documents'] = $documents;
		if($verdicts && count($verdicts)>0){
			$_SESSION['tr_tc_filter_verdicts'] = implode(',',$verdicts);
		}
		else{
			if(isset($_SESSION['tr_tc_filter_verdicts'])){
				unset($_SESSION['tr_tc_filter_verdicts']);
			}
		}
		if($automated && count($automated)>0){
			$_SESSION['tr_tc_filter_automated'] = implode(',',$automated);
		}
		else{
			if(isset($_SESSION['tr_tc_filter_automated'])){
				unset($_SESSION['tr_tc_filter_automated']);
			}
		}
		if($tags && count($tags)>0){
			$_SESSION['tr_tc_filter_tags'] = implode(',',$tags);
		}
		else{
			if(isset($_SESSION['tr_tc_filter_tags'])){
				unset($_SESSION['tr_tc_filter_tags']);			
			}
		}
		$_SESSION['current_tr_name'] = $tr_name;
		//file_put_contents('php://stderr', print_r("set_tr_tc_filter=".$_SESSION['tr_tc_filter_trid'].";".$_SESSION['tr_tc_filter_documents'].";".$_SESSION['tr_tc_filter_verdicts'].";".$_SESSION['current_tr_name'].";".$_SESSION['tr_tc_filter_tags']."\n", TRUE));
		$__response_obj->result="Pass";
		$__response_obj->TrID=$_SESSION['tr_tc_trid'];
	}
	else{
		$response_obj->result="Fail";
		$response_obj->message="No testrun is selected.";
	}	
	return $__response_obj;
}

function set_tr_tc_search(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['trid']) && isset($_POST['keywords']) && isset($_POST['search_cols'])){
		session_start();
		$_SESSION['tr_tc_list_action'] = "search";
		$_SESSION['tr_tc_trid'] = $_POST['trid'];
		$_SESSION['current_tr_name'] = isset($_POST['tr_name'])?$_POST['tr_name']:"";
		$_SESSION['tr_tc_search_keywords']=$_POST['keywords'];
		$_SESSION['tr_tc_search_cols']=$_POST['search_cols'];
		$__response_obj->result="Pass";
	}
	else{
		$response_obj->result="Fail";
		$response_obj->message="Parameters \"trid\",\"keywords\",or \"searching_cols\" are not provided!";
	}
	return $__response_obj;
}

function get_tr_documents(){
	$__response_obj=new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['trid'])) {
		$conn = db_connect();
		$sql_cmd = sprintf(
			"SELECT DISTINCT `Testcase`.Document FROM `Testcase`,`Tr_Contains_Tc` WHERE `Tr_Contains_Tc`.TcID = `Testcase`.ID And `Tr_Contains_Tc`.TrID = \"%s\"",
			$conn->real_escape_string($_POST['trid'])
		);
		//file_put_contents('php://stderr', print_r("get_tr_documents-sql_cmd=".$sql_cmd."\n", TRUE));
		$result=$conn->query($sql_cmd);

		if ($result->num_rows > 0) {
			$__response_obj->result="Pass";
			$__response_obj->documents=array();
			while($row = $result->fetch_assoc()) {
				array_push($__response_obj->documents,$row["Document"]);
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message="No tr_tcs.Doument found.";
		}
		$conn->close();
	}
	else{
		$response_obj->result="Fail";
		$response_obj->message="No TrID is provide.";
	}
	return $__response_obj;
}

function get_tr_tags(){
	$__response_obj=new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['trid'])) {
		$conn = db_connect();
		$sql_cmd = sqlcmd_get_tr_tags($conn,$_POST['trid']);
		//file_put_contents('php://stderr', print_r("get_tr_tags-sql_cmd=".$sql_cmd."\n", TRUE));
		$result=$conn->query($sql_cmd);
		if ($result->num_rows > 0) {
			$__response_obj->result="Pass";
			$__response_obj->tags=array();
			while($row = $result->fetch_assoc()) {
				array_push($__response_obj->tags,$row["Tag"]);
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message="No tag found";
		}
		$conn->close();
	}
	else{
		$response_obj->result="Fail";
		$response_obj->message="No TrID is provide.";
	}
	return $__response_obj;	
}

function get_tr_tc_list(){
	$__response_obj=new stdClass();
	session_start();
	$action = $_SESSION['tr_tc_list_action'];
	if($action && $action=="search"){
		$__response_obj = search_tr_tc_list();
	}
	else{
		$__response_obj = filter_tr_tc_list();
	}
	return	$__response_obj;
}

function get_tcids_of_trid(){
	$__response_obj=new stdClass();
	$conn = db_connect();
	if($_POST['trid']){
		$sql_cmd = sqlcmd_filter_tr_tc_list($conn,$_POST['trid'],null,null,null,null);
		$result=$conn->query($sql_cmd);
		if ($result->num_rows > 0) {
			$__response_obj->result="Pass";
			$__response_obj->tcids=array();
			while($row = $result->fetch_assoc()){
				// $tc = new stdClass();
				// $tc->ID = $row["TcID"];
				// $tc->Title = $row["Title"];
				// $tc->Verdict = $row["Verdict"];
				// $tc->Automated = $row["Automated"];
				// $tc->Note = $row["Note"];
				array_push($__response_obj->tcids,$row["TcID"]);
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message='No data!';
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message='Invalid parameter(s)!';
	}
	return	$__response_obj;
}

function filter_tr_tc_list(){
	$__response_obj = new stdClass();
	$__response_obj->action='filter_tr_tc_list';
	if(isset($_SESSION['tr_tc_trid'])){
		//Get filter fields
		$trid = $_SESSION['tr_tc_trid'];
		$documents = $_SESSION['tr_tc_filter_documents'];
		$verdicts = null;
		$automated = null;
		$tags = null;
		if(isset($_SESSION['tr_tc_filter_verdicts'])){
			$verdicts = explode(',', $_SESSION['tr_tc_filter_verdicts']);
		}
		if(isset($_SESSION['tr_tc_filter_automated'])){
			$automated = explode(',', $_SESSION['tr_tc_filter_automated']);
		}
		if(isset($_SESSION['tr_tc_filter_tags'])){
			$tags = explode(',', $_SESSION['tr_tc_filter_tags']);	
		}
		$tr_name = $_SESSION['current_tr_name'];
		$conn = db_connect();
		//start db qurey			
		//*********************** SQL COMMAND ***********************
		$sql_cmd = sqlcmd_filter_tr_tc_list($conn,$trid,$documents,$verdicts,$automated,$tags);
		$result=$conn->query($sql_cmd);
		if ($result->num_rows > 0) {
			$__response_obj->result="Pass";
			$__response_obj->trid = $trid;
			$__response_obj->tr_name = $tr_name;
			$__response_obj->testcases=array();
			while($row = $result->fetch_assoc()){
				$tc = new stdClass();
				$tc->ID = $row["TcID"];
				$tc->Title = $row["Title"];
				$tc->Verdict = $row["Verdict"];
				$tc->Automated = $row["Automated"];
				$tc->Note = $row["Note"];
				array_push($__response_obj->testcases,$tc);
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message='No data!';
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message='No testrun is selected!';
	}
	return $__response_obj;
}

function search_tr_tc_list(){
	$__response_obj = new stdClass();
	$__response_obj->action='search_tr_tc_list';
	if(isset($_SESSION['tr_tc_trid']) && isset($_SESSION['tr_tc_search_keywords']) && isset($_SESSION["tr_tc_search_cols"])){
		$conn = db_connect();
		// $_SESSION['tr_tc_search_keywords']=$_POST['keywords'];
		// $_SESSION['tr_tc_search_searching_cols']=$_POST['search_cols'];

		//Get filter fields
		$trid = $_SESSION['tr_tc_trid'];
		$tr_name = $_SESSION['current_tr_name'];
		$search_keywords = $_SESSION['tr_tc_search_keywords'];
		$search_cols = $_SESSION["tr_tc_search_cols"];	
		
		//start db qurey			
		//*********************** SQL COMMAND ***********************
		$sql_cmd = sqlcmd_search_tr_tc_list($conn,$trid,$search_keywords,$search_cols);//$tcids,$titles,$comments,$notes);
		$result=$conn->query($sql_cmd);
		if ($result && $result->num_rows > 0) {
			$__response_obj->result="Pass";
			$__response_obj->trid = $trid;
			$__response_obj->tr_name = $tr_name;
			$__response_obj->testcases=array();
			while($row = $result->fetch_assoc()){
				$tc = new stdClass();
				$tc->ID = $row["_TcID"];
				$tc->Title = $row["_Title"];
				$tc->Verdict = $row["_Verdict"];
				$tc->Automated = $row["_Automated"];
				$tc->Note = $row["_Note"];
				array_push($__response_obj->testcases,$tc);
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message='No data!';
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message='No testrun is selected!';
	}
	return $__response_obj;
}

function submit_testresult(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['trid'])&&isset($_POST['tcid'])&&isset($_POST['userid'])&&$_POST['verdict']){
		$conn = db_connect();
		$comment=isset($_POST['comment'])?$_POST['comment']:null;
		$attachment=isset($_POST['attachment'])?$_POST['attachment']:null;
		$failed_details=isset($_POST['failed_details'])?$_POST['failed_details']:null;
		$sql_cmd=sql_cmd_submit_testresult($conn,$_POST['trid'],$_POST['tcid'],$_POST['userid'],$_POST['verdict'],$comment,$attachment);
		//write_log("sql_cmd_submit_testresult",$sql_cmd);
		if($result=$conn->query($sql_cmd)){
			if($failed_details){
				$updated_time = (__get_last_verdict_updatedTime($conn,$_POST['trid'],$_POST['tcid']));
				if($updated_time){
					if(__update_testresult_failed_details($conn,$_POST['trid'],$_POST['tcid'],$updated_time,$comment,$failed_details)){
						$__response_obj->result='Pass';
					}
					else{
						$__response_obj->result='Fail';
						$__response_obj->message='Failed to update the "Failed details" information;\n'.$conn->error;
					}
				}
				else{
					$__response_obj->result='Fail';	
					$__response_obj->message='Failed to get the "UpdatedTime of current vetdict;'.$conn->error;
				}				
			}
			else{
				$__response_obj->result='Pass';
			}			
		}
		else{
			$__response_obj->result='Fail';
			$__response_obj->message=$conn->error;
		}
	}
	else{
		$__response_obj->result='Fail';
		$__response_obj->message='Invalid parameters';
	}		
	return $__response_obj;
}

function get_testcase_info(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['tcid'])){
		$conn= db_connect();
		$sql_cmd=sprintf(
			"SELECT * FROM `Testcase` WHERE ID = '%s'",
			$conn->real_escape_string($_POST['tcid'])
		);
		//file_put_contents('php://stderr', print_r("get_testcase_info-sql-cmd".$sql_cmd."\n", TRUE)); //************Debug**********
		$result=$conn->query($sql_cmd);
		if ($result->num_rows > 0) {
			$__response_obj->result="Pass";
			$__response_obj->tcinfo=new stdClass();
			$row = $result->fetch_assoc();
			$__response_obj->tcinfo->ID=$row["ID"];
			$__response_obj->tcinfo->Procedure=$row["Procedure_"];
			$__response_obj->tcinfo->ExpectedResult=$row["ExpectedResult"];
			$__response_obj->tcinfo->Title=$row["Title"];
			$__response_obj->tcinfo->Automated=$row["Automated"];
			$__response_obj->tcinfo->Legacy_ID=$row["Legacy_ID"];
			$__response_obj->tcinfo->Document=$row["Document"];
			//$__response_obj->tcinfo->ModifiedTime=$row["ModifiedTime"];

			//Get Tags of Tc
			$sql_cmd=sprintf(
				"SELECT `Tag`,`Description`,`Value_` FROM test_process_assistant.Tc_Has_Tag WHERE TcID=\"%s\"",
				$conn->real_escape_string($_POST['tcid'])
			);
			$result=$conn->query($sql_cmd);
			if($result){
				$__response_obj->tcinfo->Tags=array();
				while($row = $result->fetch_assoc()){
					$Tag=new stdClass();
					$Tag->Key=$row["Tag"];
					$Tag->Description=$row["Description"];
					$Tag->Value=$row["Value_"];
					$__response_obj->tcinfo->Tags[]=clone $Tag;
				}
			}
			//Get Hints of TC
			$sql_cmd=sprintf(
				"SELECT `Message`,`Updater`,`UpdatedTime`,`FirstName`,`LastName` FROM test_process_assistant.Hint,test_process_assistant.User WHERE (TCID=\"%s\" AND User.ID=Hint.`Updater`) ORDER BY UpdatedTime DESC LIMIT 3",
				$conn->real_escape_string($_POST['tcid'])
			);
			$result=$conn->query($sql_cmd);
			if($result){
				$__response_obj->tcinfo->Hints=array();
				while($row = $result->fetch_assoc()){
					$Hint=new stdClass();
					$Hint->Message=$row["Message"];
					$Hint->Updater=$row["FirstName"]." ".$row["LastName"];
					$Hint->UpdatedTime=$row["UpdatedTime"];
					$__response_obj->tcinfo->Hints[]=clone $Hint;
					//array_push($__response_obj->tcinfo->Hints,$Hint);
				}
			}

			if(isset($_POST['trid'])){
				//Get Verdicts of Tr_Tc
				$sql_cmd=sprintf(
					"SELECT `UpdatedTime`,`Verdict`,`Comment`,`FirstName`,`LastName`,`AttachmentLink`,
					    `Failed_ReproduceProcedure`,`Failed_ExpectedResult`,`Failed_ActualResult`,`Failed_Benckmark`,
					    `Failed_SW_BuildNum`,`Failed_SW_BuildDate`,`Failed_SW_OsVersion`,`Failed_HW_Phase`,`Failed_HW_SerialNum`,`Failed_Jira_HyperLink`		
					FROM `Usr_Exec_Tr_Tc`,`User`
					WHERE `Usr_Exec_Tr_Tc`.TrID=\"%s\"
					    AND `Usr_Exec_Tr_Tc`.TcID=\"%s\"
					    AND `Usr_Exec_Tr_Tc`.Submitter=`User`.ID ORDER BY `UpdatedTime` DESC",
					$conn->real_escape_string($_POST['trid']),
					$conn->real_escape_string($_POST['tcid'])
				);
				//file_put_contents('php://stderr', print_r("get-verdicts-sql-cmd".$sql_cmd."\n", TRUE)); //************Debug**********
				$result=$conn->query($sql_cmd);
				if ($result->num_rows > 0) {
					$__response_obj->tcinfo->Verdicts=array();
					while($row = $result->fetch_assoc()){
						$verdict=new stdClass();
						$verdict->text=$row["Verdict"];
						$verdict->comment=$row["Comment"];
						$verdict->attachment=$row["AttachmentLink"];
						$verdict->updated_time = $row["UpdatedTime"];
						$verdict->tester_f_name=$row["FirstName"];
						$verdict->tester_l_name=$row["LastName"];
						$verdict->tester = $row["FirstName"]."_".$row["LastName"];
						if ($row['Failed_ReproduceProcedure'] ||
							$row['Failed_ExpectedResult'] ||
							$row['Failed_ActualResult'] ||
							$row['Failed_Benckmark'] ||
							$row['Failed_SW_BuildNum'] ||
							$row['Failed_SW_BuildDate'] ||
							$row['Failed_SW_OsVersion'] ||
							$row['Failed_HW_Phase'] ||
							$row['Failed_HW_SerialNum'])
						{
							$verdict->failed_details=new stdClass();
							$verdict->failed_details->reperduce_procedure=$row['Failed_ReproduceProcedure'];
							$verdict->failed_details->expected_result=$row['Failed_ExpectedResult'];
							$verdict->failed_details->actual_result=$row['Failed_ActualResult'];
							$verdict->failed_details->benchmark=$row['Failed_Benckmark'];
							$verdict->failed_details->sw_build_num=$row['Failed_SW_BuildNum'];
							$verdict->failed_details->sw_build_date=$row['Failed_SW_BuildDate'];
							$verdict->failed_details->sw_os_version=$row['Failed_SW_OsVersion'];
							$verdict->failed_details->hw_phase=$row['Failed_HW_Phase'];
							$verdict->failed_details->hw_serial_num=$row['Failed_HW_SerialNum'];							
						}
						if($row['Failed_Jira_HyperLink']){
							$verdict->jira_hyperlink=$row['Failed_Jira_HyperLink'];
						}
						array_push($__response_obj->tcinfo->Verdicts,$verdict);
					}
				}
				//Get Note of Tr_Tc
				$sql_cmd=sprintf("SELECT `Note` FROM `test_process_assistant`.`Tr_Tc_Has_Note` WHERE TrID=\"%s\" AND TcID=\"%s\"",
					$conn->real_escape_string($_POST['trid']),
					$conn->real_escape_string($_POST['tcid'])
				);
				$result=$conn->query($sql_cmd);
				if($result){
					$row = $result->fetch_assoc();
					$__response_obj->tcinfo->Note=$row["Note"];
				}
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message='No data was found!';
		}		
		$conn->close();
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message='No TCID was provided.';
	}
	return $__response_obj;
}

function get_active_testrun_list(){
	$__response_obj = new stdClass();
	$__response_obj->action =$_POST['action'];
	$conn = db_connect();
	$sql_cmd='SELECT * FROM TestRun WHERE Active=TRUE';
	$result=$conn->query($sql_cmd);	
	//file_put_contents('php://stderr', print_r('Result rows='.$result->num_rows."\n", TRUE)); //************Debug**********
	if ($result->num_rows > 0) {
		$__response_obj->result="Pass";
		$__response_obj->testruns=array();
		// output data of each row
		while($row = $result->fetch_assoc()) {
			$testrun= new stdClass();
			$testrun->ID=$row["ID"];
			$testrun->Name=$row["Name"];
			$__response_obj->testruns[]=clone $testrun;
			//file_put_contents('php://stderr', print_r('Testrun obj='.$myJson."\n", TRUE)); //************Debug**********
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="No active testrun found!";
	}
	$conn->close();
	//file_put_contents('php://stderr', print_r('Testrun array ='.$json_array."\n", TRUE)); 
	return $__response_obj;
}

function get_testrun_list(){
 	$__response_obj = new stdClass();
	$__response_obj->action =$_POST['action'];
	$conn = db_connect();
	$sql_cmd='SELECT * FROM TestRun';
	$result=$conn->query($sql_cmd);	
	//file_put_contents('php://stderr', print_r('Result rows='.$result->num_rows."\n", TRUE)); //************Debug**********
	if ($result->num_rows > 0) {
		$__response_obj->result="Pass";
		$__response_obj->testruns=array();
		// output data of each row
		while($row = $result->fetch_assoc()) {
			$testrun= new stdClass();
			$testrun->ID=$row["ID"];
			$testrun->Name=$row["Name"];
			$testrun->Active=$row["Active"];
			$testrun->Owner=$row["Owner"];
			$__response_obj->testruns[]=clone $testrun;
			//file_put_contents('php://stderr', print_r('Testrun obj='.$myJson."\n", TRUE)); //************Debug**********
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="No active testrun found!";
	}
	$conn->close();
	//file_put_contents('php://stderr', print_r('Testrun array ='.$json_array."\n", TRUE)); 
	return $__response_obj;
}

function get_testrun_overview($trid){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	$conn = db_connect();
	$sql_cmd=sqlcmd_testrun_overview($conn,$trid);
	$result=$conn->query($sql_cmd);	
	if ($result->num_rows > 0) {
		$__response_obj->result="Pass";
		$__response_obj->documents=array();
		// output data of each row
		while($row = $result->fetch_assoc()) {
			$doc=new stdClass();
			$doc->name=$row["Document"];
			$doc->amount=$row["Amount"];
			$doc->non_count=$row["Null_Count"];
			$doc->p_count=$row["Pass_count"];
			$doc->f_count=$row["Fail_count"];
			$doc->b_count=$row["Blocked_count"];
			$doc->e_count=$row["Exempted_count"];
			$doc->i_count=$row["Indeterminate_count"];
			$__response_obj->documents[]=clone $doc;
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="No active testrun found!";
	}
	$conn->close();
	return $__response_obj;
}

function commit_sticky_note(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	$conn = db_connect();
	if(isset($_POST['trid']) && isset($_POST['tcid']) && isset($_POST['userid']))
	{
		if(isset($_POST['note']) && strlen($_POST['note'])){
			$sql_cmd= sqlcmd_commit_sticky_note($conn,$_POST['trid'],$_POST['tcid'],$_POST['note'],$_POST['userid']);
		}
		else{
			$sql_cmd= sqlcmd_remove_sticky_note($conn,$_POST['trid'],$_POST['tcid']);
		}
		$result=$conn->query($sql_cmd);	
		//file_put_contents('php://stderr', print_r('commit_sticky_note, cmd='.$sql_cmd."; "."result=".$result."\n", TRUE)); //************Debug**********
		if ($result) {
			$__response_obj->result="Pass";
		}
		else{
			$__response_obj->result="Fail";			
			$__response_obj->message=$conn->error;
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="Not enough parameters are given!";
	}
	$conn->close();
	//file_put_contents('php://stderr', print_r('Testrun array ='.$json_array."\n", TRUE)); 
	return $__response_obj;
}

function commit_hint(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	$conn = db_connect();
	if(isset($_POST['tcid']) && isset($_POST['updater']) && isset($_POST['message'])){
		if(isset($_POST['hyper_link'])){
			$sql_cmd = sql_cmd_commit_hint($conn,$_POST['tcid'],$_POST['message'],$_POST['updater'],$_POST['hyper_link']);
		}
		else{
			$sql_cmd = sql_cmd_commit_hint($conn,$_POST['tcid'],$_POST['message'],$_POST['updater']);
		}
		$result=$conn->query($sql_cmd);	
		//file_put_contents('php://stderr', print_r('commit_sticky_note, cmd='.$sql_cmd."; "."result=".$result."\n", TRUE)); //************Debug**********
		if ($result) {
			$__response_obj->result="Pass";
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message=$conn->error;
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="Not enough parameters are given!";
	}
	$conn->close();
	//file_put_contents('php://stderr', print_r('Testrun array ='.$json_array."\n", TRUE)); 
	return $__response_obj;
}

function update_testresult_failed_details(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	$conn = db_connect();
	if(isset($_POST['trid'])&&isset($_POST['tcid'])&&isset($_POST['updated_time'])){
		$comment=isset($_POST['comment'])?$_POST['comment']:null;
		$failed_details=isset($_POST['failed_details'])?$_POST['failed_details']:null;
		// $jira_hyperlink=isset($_POST['jira_hyperlink'])?$_POST['jira_hyperlink']:null;
		if (__update_testresult_failed_details($conn,$_POST['trid'],$_POST['tcid'],$_POST['updated_time'],$comment,$failed_details)){
			$__response_obj->result="Pass";
		}
		else{
			$__response_obj->result="Fail";			
			$__response_obj->message=$conn->error;
		}
	}
	else{
		$__response_obj->result='Fail';
		$__response_obj->message='Invalid parameters';
	}
	$conn->close();
	return $__response_obj;
}

function get_test_verdict(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];	
	if(isset($_POST['trid']) && isset($_POST['tcid'])){
		$conn = db_connect();
		$sql_cmd=sql_cmd_get_current_testcase_verdict($conn,$_POST['trid'],$_POST['tcid']);
		$result=$conn->query($sql_cmd);
		if($result && $result->num_rows>0){
			$row = $result->fetch_assoc();		
			$__response_obj->result="Pass";
			$__response_obj->verdict=$row['Verdict'];
			$__response_obj->tester=$row['Submitter'];		
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message=$conn->error;
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="Incorrect parameters!";
	}
	$conn->close();
	return $__response_obj;
}

function __update_testresult_failed_details($conn,$trid,$tcid,$updated_time,$comment,$failed_details){		
	$sql_cmd=sql_cmd_update_testresult_failed_details($conn,$trid,$tcid,$updated_time,$comment,$failed_details);
	if($result=$conn->query($sql_cmd)){
		return true;
	}
	else{
		return false;
	}
}

function __get_current_testresult_row($conn,$trid,$tcid){
	$sql_cmd= sql_cmd_get_current_testcase_verdict($conn,$trid,$tcid);
	$result=$conn->query($sql_cmd);
	$return_val = null;
	if($result && $result->num_rows>0){
		$return_val = $result->fetch_assoc();
	}	
	//file_put_contents('php://stderr', print_r('Testrun array ='.$json_array."\n", TRUE)); 
	return $return_val;
}

function __get_last_verdict_updatedTime($conn,$trid,$tcid){  
	$data_row = __get_current_testresult_row($conn,$trid,$tcid);
	if ($data_row===null || !isset($data_row['UpdatedTime'])){
		return null;
	}
	else{
		return $data_row['UpdatedTime'];
	}
}

function sqlcmd_filter_tr_tc_list($conn,$trid,$documents,$verdicts,$automated,$tags){
	$sql_cmd = sprintf(
		"SELECT trtcs_with_note.TcID,trtcs_with_note.Title,Verdict,Automated,Note
		FROM(
			SELECT trtcs.TrID,trtcs.TcID,Title,Document,Automated,Note
			FROM(
				(SELECT TrID, `Testcase`.ID TcID,`Testcase`.Title,`Testcase`.Document,`Testcase`.Automated
				 FROM `Tr_Contains_Tc`,`Testcase` 
				 WHERE `Tr_Contains_Tc`.TcID=`Testcase`.ID AND `Tr_Contains_Tc`.TrID=\"%s\") AS trtcs
			LEFT JOIN `Tr_Tc_Has_Note`
			ON trtcs.TrID=`Tr_Tc_Has_Note`.TrID AND trtcs.TcID=`Tr_Tc_Has_Note`.TcID)) AS trtcs_with_note
		Left JOIN (
			SELECT `Usr_Exec_Tr_Tc`.TrID,`Usr_Exec_Tr_Tc`.TcID,Verdict,LastUpdatedTime
			FROM `Usr_Exec_Tr_Tc`,(
				SELECT TrID,TcID,MAX(UpdatedTime) as LastUpdatedTime
				FROM `Usr_Exec_Tr_Tc` GROUP BY TrID,TcID
			) AS last_records
			WHERE `Usr_Exec_Tr_Tc`.TrID=last_records.TrID AND `Usr_Exec_Tr_Tc`.TcID=last_records.TcID AND `Usr_Exec_Tr_Tc`.UpdatedTime=last_records.LastUpdatedTime
		) AS all_verdicts 
		ON all_verdicts.TrID = trtcs_with_note.TrID and all_verdicts.TcID  = trtcs_with_note.TcID",
		$conn->real_escape_string($trid)
	);	

	//*********************** SQL COMMAND ***********************
	$condiction_str = "";
	//----------------Generate Document filter command ----------------
	if($documents and mb_strcasecmp($documents,"all")!=0){
		if(strlen($condiction_str)==0){
			$condiction_str=" WHERE " ;
		}
		else{
			$condiction_str.=" AND ";
		}
		$condiction_str.=sprintf("Document=\"%s\"",
			$conn->real_escape_string($documents));
	}
	//----------------Generate Verdicts filter command ----------------

	//---------------- Verdicts ----------------
	if($verdicts && count($verdicts)>0){
		if(strlen($condiction_str)==0){
			$condiction_str=" WHERE (" ;
		}
		else{
			$condiction_str.=" AND (";
		}
		foreach($verdicts as $verdict){
			$ver_str="";
			if($verdict=="P"){
				$ver_str="=\"Passed\"";
			}
			else if($verdict=="F"){
				$ver_str="=\"Failed\"";
			}
			else if($verdict=="B"){
				$ver_str="=\"Blocked\"";
			}
			else if($verdict=="E"){
				$ver_str="=\"Exempted\"";
			}
			else if($verdict=="I"){
				$ver_str="=\"Indeterminate\"";
			}
			else if($verdict=="N"){
				$ver_str=" IS NULL";
			}
			$condiction_str.=sprintf("`Verdict`%s OR ",$ver_str);
		}
		$condiction_str = rtrim($condiction_str," OR ");
		$condiction_str.=")";
	}
	//---------------- Automated ----------------
	if($automated && count($automated)>0){
		if(strlen($condiction_str)==0){
			$condiction_str=" WHERE (" ;
		}
		else{
			$condiction_str.=" AND (";
		}
		foreach($automated as $auto){
			$auto_str="";
			if($auto=="A"){
				$auto_str="=\"A\"";
			}
			else if($auto=="S"){
				$auto_str="=\"S\"";
			}
			else if($auto=="N"){
				$auto_str=" IS NULL";
			}
			$condiction_str.=sprintf("`Automated`%s OR ",$auto_str);
		}
		$condiction_str = rtrim($condiction_str," OR ");
		$condiction_str.=")";
	}
	$sql_cmd.=$condiction_str;

	//---------------- Tags ----------------
	if($tags!=null && count($tags)>0){
		$sql_cmd = sprintf("SELECT all_result_before_tag.*,Tag
					   	FROM (%s)AS all_result_before_tag,`Tc_Has_Tag`
					   	WHERE all_result_before_tag.TcID = `Tc_Has_Tag`.TcID AND (",
					   	$sql_cmd)
						;
		foreach($tags as $tag){
			$sql_cmd.=sprintf("`Tag`=\"%s\" OR ",$tag);
		}
		$sql_cmd = rtrim($sql_cmd," OR ");
		$sql_cmd.=")";
	}
	//----------------Generate Tags filter command ----------------
	return $sql_cmd;
}

function sqlcmd_search_tr_tc_list($conn,$trid,$keywords,$columns){//$tcids=null,$titles=null,$comments=null,$notes=null){
	$sql_cmd = sprintf(
		"SELECT _TcID,_Title,_Verdict,_Comment,_Note,_Procedure,_ExpectedResult,_Automated
		FROM(
			SELECT trtcs.TrID,trtcs.TcID _TcID,Title _Title,Note _Note,Automated _Automated,Procedure_ _Procedure,ExpectedResult _ExpectedResult
			FROM(
				(SELECT TrID, `Testcase`.ID TcID,`Testcase`.Title,`Testcase`.Document,`Testcase`.Automated,`Testcase`.Procedure_,`Testcase`.ExpectedResult
				 FROM `Tr_Contains_Tc`,`Testcase` 
				 WHERE `Tr_Contains_Tc`.TcID=`Testcase`.ID AND `Tr_Contains_Tc`.TrID=\"%s\") AS trtcs
			LEFT JOIN `Tr_Tc_Has_Note`
			ON trtcs.TrID=`Tr_Tc_Has_Note`.TrID AND trtcs.TcID=`Tr_Tc_Has_Note`.TcID)) AS trtcs_with_note
		Left JOIN (
			SELECT `Usr_Exec_Tr_Tc`.TrID,`Usr_Exec_Tr_Tc`.TcID,Verdict _Verdict,`Comment` _Comment,LastUpdatedTime
			FROM `Usr_Exec_Tr_Tc`,(
				SELECT TrID,TcID,MAX(UpdatedTime) as LastUpdatedTime
				FROM `Usr_Exec_Tr_Tc` GROUP BY TrID,TcID
			) AS last_records
			WHERE `Usr_Exec_Tr_Tc`.TrID=last_records.TrID AND `Usr_Exec_Tr_Tc`.TcID=last_records.TcID AND `Usr_Exec_Tr_Tc`.UpdatedTime=last_records.LastUpdatedTime
		) AS all_verdicts 
		ON all_verdicts.TrID = trtcs_with_note.TrID and all_verdicts.TcID = _TcID",
		$conn->real_escape_string($trid)
		);
	//*********************** condiction_str ***********************
	$condiction_str = "";
	//----------------Generate Document filter command ----------------
	foreach($columns as $col){
		if(strlen($condiction_str)==0){
			$condiction_str=" WHERE (" ;
		}
		else{
			$condiction_str.=" OR (";
		}
		$keyword_str='';
		foreach($keywords as $keyword){			
			if(strlen($keyword_str)>0){
				$keyword_str.=" OR ";
			}
			if($col=="_Note" && mb_strcasecmp($keyword,"ALL")==0){
				$keyword_str.=$col." IS NOT NULL";
				//$condiction_str.=$col." IS NOT NULL";
				break;
			}
			else{
				$keyword_str.=sprintf("%s like \"%%%s%%\"",
					$col,
					$conn->real_escape_string($keyword));
			}
		}
		$condiction_str.=$keyword_str;
		$condiction_str = rtrim($condiction_str," OR ");
		$condiction_str.=")";		
	}
	$sql_cmd.=$condiction_str;
	return $sql_cmd;
}

function sqlcmd_commit_sticky_note($conn,$trid,$tcid,$note,$submitter){
	$tcid = $conn->real_escape_string($tcid);
	$note = $conn->real_escape_string($note);
	$sql_cmd = sprintf("INSERT INTO `test_process_assistant`.`Tr_Tc_Has_Note`(`TrID`,`TcID`,`Note`,`Submitter`) VALUES (\"%s\", \"%s\",\"%s\",\"%s\") ON DUPLICATE KEY UPDATE `TrID`=\"%s\", `TcID`=\"%s\",`Note`=\"%s\",`Submitter`=\"%s\"",
		$trid,
		$tcid,
		$note,
		$submitter,
		$trid,
		$tcid,
		$note,
		$submitter
		);
	return $sql_cmd;
}

function sqlcmd_remove_sticky_note($conn,$trid,$tcid){
	$sql_cmd=sprintf("DELETE FROM test_process_assistant.Tr_Tc_Has_Note WHERE TrID=\"%s\" AND TcID=\"%s\"",
		$trid,
		$tcid);
	return $sql_cmd;
}

function sqlcmd_testrun_overview($conn,$trid){
	$sql_cmd=sprintf(
	"SELECT Document,
	Count(*) AS Amount,
	SUM(case when Verdict is NULL then 1 else 0 end) as Null_Count,
	SUM(case when Verdict = \"Passed\" then 1 else 0 end) as Pass_count,
	SUM(case when Verdict = \"Failed\" then 1 else 0 end) as Fail_count,
	SUM(case when Verdict = \"Blocked\" then 1 else 0 end) as Blocked_count,
	SUM(case when Verdict = \"Exempted\" then 1 else 0 end) as Exempted_count,
	SUM(case when Verdict = \"Indeterminate\" then 1 else 0 end) as Indeterminate_count
	FROM(
		SELECT `All_Tr_Tc_with_Verdict`.TcID,`Testcase`.Document,`All_Tr_Tc_with_Verdict`.Verdict
		FROM (
			SELECT Selected_TR.TcID,All_Verdicts.Verdict
			FROM (
				(SELECT TrID,TcID
				FROM `Tr_Contains_Tc`
				WHERE `Tr_Contains_Tc`.TrID=\"%s\") AS Selected_TR)
				LEFT JOIN
				(SELECT `Usr_Exec_Tr_Tc`.TrID,`Usr_Exec_Tr_Tc`.TcID,Verdict
				FROM `Usr_Exec_Tr_Tc`,(
					SELECT TrID,TcID,MAX(UpdatedTime) as LastUpdatedTime
					FROM `Usr_Exec_Tr_Tc` GROUP BY TrID,TcID
				) AS last_records
				WHERE `Usr_Exec_Tr_Tc`.TrID=last_records.TrID AND `Usr_Exec_Tr_Tc`.TcID=last_records.TcID AND `Usr_Exec_Tr_Tc`.UpdatedTime=last_records.LastUpdatedTime 
			) AS All_Verdicts
			ON `All_Verdicts`.TrID=`Selected_TR`.TrID AND `All_Verdicts`.TcID=`Selected_TR`.TcID
			) AS All_Tr_Tc_with_Verdict,`Testcase`
			WHERE `All_Tr_Tc_with_Verdict`.TcID=`Testcase`.ID
			)AS All_Tr_Tc_Verdict_with_Document
	GROUP BY Document",
	$conn->real_escape_string($trid)
	);
	return $sql_cmd;
}

function sqlcmd_get_tr_tags($conn,$trid){
	$sql_cmd = sprintf("SELECT DISTINCT `Tag` FROM `Tr_Contains_Tc`,`Tc_Has_Tag`
		WHERE `Tr_Contains_Tc`.TcID=`Tc_Has_Tag`.TcID AND `Tr_Contains_Tc`.TrID = \"%s\"",
		$conn->real_escape_string($trid)
	);
	return $sql_cmd;
}

function sql_cmd_commit_hint($conn,$tcid,$message,$updater,$hyper_link=null){
	if($hyper_link && strlen($hyper_link)){
		$sql_str_hyper_link = '"'.$hyper_link.'"';
	}	
	else{
		$sql_str_hyper_link="NULL";
	}
	$sql_cmd = sprintf("INSERT INTO test_process_assistant.Hint(`TCID`,`Message`,`HyperLink`,`Updater`) Values(\"%s\",\"%s\",%s,\"%s\")",
		$conn->real_escape_string($tcid),
		$conn->real_escape_string($message),
		$conn->real_escape_string($sql_str_hyper_link),
		$updater
	);
	return $sql_cmd;
}

function sql_cmd_submit_testresult($conn,$trid,$tcid,$user_id,$verdict,$comment=null,$attachment=null){
	if($comment){
		$cmd_str_comment=",Comment";
		$val_str_comment=",\"".$conn->real_escape_string($comment)."\"";
	}
	else{
		$cmd_str_comment="";
		$val_str_comment="";
	}
	if($attachment){
		$cmd_str_attachment=",AttachmentLink";
		$val_str_attachment=",\"".$conn->real_escape_string($attachment)."\"";
	}
	else{
		$cmd_str_attachment="";
		$val_str_attachment="";
	}	
	$sql_cmd = sprintf(
		"INSERT Into `Usr_Exec_Tr_Tc` (TrID,TcID,Submitter,Verdict%s%s) 
		Values(\"%s\",\"%s\",\"%s\",\"%s\"%s%s)",
		$cmd_str_comment,
		$cmd_str_attachment,
		$conn->real_escape_string($trid),
		$conn->real_escape_string($tcid),
		$conn->real_escape_string($user_id),
		$conn->real_escape_string($verdict),
		$val_str_comment,
		$val_str_attachment);
	return $sql_cmd;
}

function sql_cmd_update_testresult_failed_details($conn,$trid,$tcid,$updated_time,$comment,$failed_details){
	$sql_cmd="";
	$str_cmd="";
	if($comment){
		if($str_cmd and strlen($str_cmd)>0){
			$str_cmd.=", ";
		}
		$str_cmd.="`Comment`=";
		$str_cmd.="\"".$conn->real_escape_string($comment)."\"";
	}
	if($failed_details){
		if(isset($failed_details["reproduce_procedure"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_ReproduceProcedure`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["reproduce_procedure"])."\"";		
		}
		if(isset($failed_details["expected_result"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_ExpectedResult`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["expected_result"])."\"";		
		}
		if(isset($failed_details["actual_result"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_ActualResult`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["actual_result"])."\"";
		}
		if(isset($failed_details["benchmark"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_Benckmark`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["benchmark"])."\"";
		}
		if(isset($failed_details["sw_build_num"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_SW_BuildNum`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["sw_build_num"])."\"";
		}
		if(isset($failed_details["sw_build_date"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_SW_BuildDate`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["sw_build_date"])."\"";
		}
		if(isset($failed_details["sw_os_version"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_SW_OsVersion`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["sw_os_version"])."\"";
		}
		if(isset($failed_details["hw_phase"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_HW_Phase`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["hw_phase"])."\"";
		}
		if(isset($failed_details["hw_serial_num"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_HW_SerialNum`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["hw_serial_num"])."\"";
		}
		if(isset($failed_details["jira_hyperlink"])){
			if($str_cmd and strlen($str_cmd)>0){
				$str_cmd.=", ";
			}
			$str_cmd.="`Failed_Jira_HyperLink`=";
			$str_cmd.="\"".$conn->real_escape_string($failed_details["jira_hyperlink"])."\"";
		}
	}
	// if($jira_hyperlink){
	// 	if($str_cmd and strlen($str_cmd)>0){
	// 		$str_cmd.=", ";
	// 	}
	// 	$str_cmd.="`Failed_Jira_HyperLink`=";
	// 	$str_cmd.="\"".$conn->real_escape_string($jira_hyperlink)."\"";
	// }
	$sql_cmd = sprintf("UPDATE `Usr_Exec_Tr_Tc` SET %s WHERE `TrID`='%s' AND `TcID`='%s' AND `UpdatedTime`='%s'",
	$str_cmd,
	$trid,
	$tcid,
	$updated_time
	);
	write_log("sql_cmd_update_testresult_failed_details=",$sql_cmd);
	return $sql_cmd;
}

function sql_cmd_get_current_testcase_verdict($conn,$trid,$tcid){
	$sql_cmd = sprintf('SELECT *
		FROM `Usr_Exec_Tr_Tc`
		WHERE `Usr_Exec_Tr_Tc`.TrID="%s" AND `Usr_Exec_Tr_Tc`.TcID="%s" 
		ORDER BY `UpdatedTime` DESC
		LIMIT 1',
		$conn->real_escape_string($trid),
		$conn->real_escape_string($tcid)
	);
	return $sql_cmd;
}

$response_obj=new stdClass();
if(isset($_POST['action'])) {
	// ************ set_tr_tc_filter ****************
	if($_POST['action'] == 'set_tr_tc_filter'){
		$response_obj = set_tr_tc_filter();				
	}
	else if($_POST['action'] == 'set_tr_tc_search') {
		$response_obj = set_tr_tc_search();				
	}
	// ************ get_testrun_overview ****************
	else if($_POST['action']=='get_testrun_overview'){
		if(isset($_POST['trid'])) {
			$response_obj = get_testrun_overview($_POST["trid"]);
		}
		else{
			$response_obj->action=$_POST['action'];
			$response_obj->result="Fail";
			$response_obj->message="No TrID is provide.";
		}
	}
	// ************ get_tr_documents ****************
	else if($_POST['action']=='get_tr_documents'){
		if(isset($_POST['trid'])) {
			$response_obj = get_tr_documents($_POST["trid"]);
		}
		else{
			$response_obj->action=$_POST['action'];
			$response_obj->result="Fail";
			$response_obj->message="No TrID is provide.";
		}
	}
	// ************ get_tr_tc_list ****************
	else if($_POST['action']=='get_tr_tc_list'){
		$response_obj = get_tr_tc_list();
	}
	// ************ submit_testresult ****************
	else if($_POST['action']=='submit_testresult'){
		$response_obj = submit_testresult();
	}
	// ************ get_testcase_info ****************
	else if($_POST['action']=='get_testcase_info'){
		$response_obj = get_testcase_info();
	}
	// ************ get_active_testrun_list ****************
	else if($_POST['action']=='get_active_testrun_list'){
		$response_obj = get_active_testrun_list();
	}
	else if($_POST['action']=='get_testrun_list'){
		$response_obj = get_testrun_list();
	}
	// ************ commit_sticky_note ****************
	else if ($_POST['action']=='commit_sticky_note'){
		$response_obj = commit_sticky_note();
	}
	// ************ get_tr_tags ****************
	else if ($_POST['action']=='get_tr_tags'){
		$response_obj = get_tr_tags();
	}
	// ************ commit_hint ****************
	else if ($_POST['action']=='commit_hint'){
		$response_obj = commit_hint();
	}
	// ************ update failed details ****************
	else if ($_POST['action']=='update_testresult_failed_details'){
		$response_obj = update_testresult_failed_details();
	}
	// ************ get tcid list of trid ****************
	else if ($_POST['action']=='get_tcids_of_trid'){
		$response_obj = get_tcids_of_trid();
	}

	else if ($_POST['action']=='get_test_verdict'){
		$response_obj = get_test_verdict();
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