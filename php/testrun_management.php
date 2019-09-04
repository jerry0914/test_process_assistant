<?php
require_once __DIR__."/common_lib.php";
require_once __DIR__."/trs_writer.php";
require_once __DIR__."/trs_parser.php";
include __DIR__."/settings.php";

function get_active_users(){
	$conn = db_connect();
	$sql_cmd = "SELECT * FROM `User` WHERE `Active` = '1'";
	$result=$conn->query($sql_cmd);
	$__response_obj=new stdClass();
	if ($result->num_rows > 0) {
		$__response_obj->result="Pass";
		$__response_obj->users=array();
		while($row = $result->fetch_assoc()) {
			$user = new stdClass();
			$user->ID=$row["ID"];
			$user->FirstName=$row["FirstName"];
			$user->LastName=$row["LastName"];
			$user->Permission=$row["Permission"];
			array_push($__response_obj->users,$user);
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="There is not any active user here.";
	}
	$conn->close();
	return $__response_obj;
}

function export_testrun(){
	$__response_obj=new stdclass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['trid']) && isset($_POST['base_file'])){
		$trid = $_POST['trid'];
		$base_file=$_POST['base_file'];
		$tester_id=isset($_POST['tester_id'])?$_POST['tester_id']:-1;
		$document=isset($_POST['document'])?$_POST['document']:'ALL';
		$verdicts=isset($_POST['verdicts'])?explode(",",$_POST['verdicts']):null;
		$trw = new TRS_Writer();
		$testcase_list = __get_filterd_testcases($trid,$tester_id,$document,$verdicts);
		if(count($testcase_list)>0){
			$__response_obj = $trw->write_trs($testcase_list,$base_file);
			if($__response_obj->result=="Pass"){
				$file=$__response_obj->output_file;
				$__response_obj->base64=__file_to_base64($file);
				//__transfer_file($file);
				unset($__response_obj->output_file);
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message="Here was not any testing result found.";
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="Variables: trid or base file was NOT provided.";
	}	
	return $__response_obj;
}

function is_testrun_exist(){
	$conn = db_connect();
	$__response_obj=new stdclass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['tr_name'])){
		$sql_cmd=__sql_cmd_is_testrun_exist($conn,$_POST['tr_name']);
		$result=$conn->query($sql_cmd);
		if ($result){
			$row = $result->fetch_assoc();
			$__response_obj->result="Pass";
			$__response_obj->is_exist=$row["is_exist"];
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message=mysqli_error($conn);
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="Parameter \"tr_name\" doesnot found!" ;
	}
	return $__response_obj;
}

function find_tr_trs_files(){
	$__response_obj=new stdclass();
	$__response_obj->action=$_POST['action'];
	global $TRS_UPLOAD_FOLDER;
	if(isset($_POST['trid'])){
		$__trs_folder = $TRS_UPLOAD_FOLDER.$_POST['trid']."/";
		if(file_exists($__trs_folder)){
			$trs_folder_list = scandir($__trs_folder);
			$__response_obj->trs_files=array();
			foreach($trs_folder_list AS $trs_file){
				if(is_dir($trs_file)){
					// Do NOT support sub-dir here, just ignore it now.
				}
				else{
					$file=new stdClass();
					$file->path = $__trs_folder.$trs_file;
					$file->name = $trs_file;
					array_push($__response_obj->trs_files, $file);
				}
			}
			if(count($__response_obj->trs_files)>0){
				$__response_obj->result="Pass";
			}
			else{
				$__response_obj->result="Fail";
				$__response_obj->message="There was not any trs_file found.";
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message="There was not any trs_file found.";
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="Variables: trid was NOT provided.";
	}
	return $__response_obj;
}

function update_testrun_active(){
	$conn = db_connect();
	$__response_obj=new stdclass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['trid']) && isset($_POST['active'])){
		$sql_cmd = __sql_cmd_update_tr_active($conn,$_POST['trid'],$_POST['active']);
		$result=$conn->query($sql_cmd);
		if ($result){
			$__response_obj->result="Pass";
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message=mysqli_error($conn);
		}
	}
	else{
		$__response_obj->result="Fail";
		$__response_obj->message="Parameters: trid or active were NOT provided.";
	}
	return $__response_obj;
}

function create_testrun(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST["tr_name"]) && $_POST["user_id"]){
		$conn=db_connect();
		try{
			$sql_cmd = sprintf("INSERT INTO `test_process_assistant`.`TestRun` (`Name`, `Owner`) VALUES(\"%s\",\"%s\")",
				$conn->real_escape_string($_POST["tr_name"]),
				$_POST["user_id"]
			);
			if($result = $conn->query($sql_cmd)){
				$sql_cmd ="SELECT LAST_INSERT_ID()";
				if($result = $conn->query($sql_cmd)){
					$row = $result->fetch_assoc();
					$__response_obj->result = "Pass";
					$__response_obj->trid = $row["LAST_INSERT_ID()"];
				}
				else{
					$__response_obj->result = "Fail";
					$__response_obj->message = mysqli_error($conn);
				}
			}
			else{
				$__response_obj->result = "Fail";
				$__response_obj->message = mysqli_error($conn);

			}	
		}
		catch (Exception $e) {
		 	$__response_obj->result = "Fail";
		 	$__response_obj->message = "Catch exception: ".$e->getMessage();
		 	write_log($__response_obj->action,$__response_obj->message);
	 	}
		finally{
			$conn->close();
		}
	}
	else{
		$__response_obj->result = "Fail";
		$__response_obj->message = "Parameters:\"tr_name\" or \"user_id\" do not found";
	}
	return $__response_obj;
}

function delete_testrun(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	if(isset($_POST['trid'])){
		$trid=$_POST['trid'];
		try{
			$message="";
			$message.=__del_tr_contains_tc($trid);
			$message.=__del_usr_exec_tr_tc($trid);
			$message.=__del_tr_tc_has_note($trid);
			$message.=__del_testrun($trid);
			$message.=__del_trs_files_of_testrun($trid);
			if(strlen($message)==0){
				$__response_obj->result = "Pass";
			}
		}
		catch (Exception $e) {
		 	$__response_obj->result = "Fail";
			$__response_obj->message = "Catch exception: ".$e->getMessage();
		 	write_log($__response_obj->action,$__response_obj->message);
	 	}
		finally{
		}
	}
	else{
		$__response_obj->result = "Fail";
		$__response_obj->message = "Parameter \"trid\" does not provided";
	}
	return $__response_obj;
}

function import_tested_result(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];	
	if(isset($_POST['trid']) && isset($_POST['user_id']) && isset($_POST['files'])) {
		$conn=db_connect();
		$trid=$_POST['trid'];
		$user_id=$_POST['user_id'];
		$files=$_POST['files'];
		$testcase_list=array();
		$modified_list=array();
		foreach($files as $file){
			$tr = new TRS_Parser($file);
			$testcase_list = array_merge($testcase_list,$tr->getTestcaseList());
		}
		foreach($testcase_list as $testcase){
			if(isset($testcase["ID"]) && isset($testcase["Verdict"]) && strlen($testcase['Verdict'])>0){
				$row=__get_current_testresult_row($conn,$trid,$testcase["ID"]);				
				if((!$row) || //It is a new record				   
				   (!isset($row['Verdict']) || $row['Verdict']!=$testcase['Verdict'] || $row['Comment']!=$testcase['Comment'])){ //Old reoord need to be updated
					$modified_tc = new stdClass();
					$comment=(isset($testcase["Comment"]) && strlen($testcase['Comment'])>0)?$testcase["Comment"]:null;
					if(submit_modified_testresult($conn,$trid,$testcase['ID'],$user_id,$testcase["Verdict"],$comment)){
						$modified_tc->submit_result='Success';	
					}						
					else{
						$modified_tc->submit_result='Failed';
					}
					$modified_tc->ID=$testcase['ID'];
					$modified_tc->Verdict=$testcase['Verdict'];
					$modified_tc->Comment=$comment;
					array_push($modified_list,$modified_tc);					
				}			
			}			
		}
		$__response_obj->result = "Pass";
		$__response_obj->modified_list = $modified_list;
	}
	else{
		$__response_obj->result = "Fail";
		$__response_obj->message = "Parameters:\"trid\",\"user_id\" or \"files\"do not found";
	}
	return $__response_obj;
}

function submit_modified_testresult($conn,$trid,$tcid,$user_id,$verdict,$comment=null,$attachment=null){
	$sql_cmd=sql_cmd_submit_testresult($conn,$trid,$tcid,$user_id,$verdict,$comment,$attachment);
	$result=$conn->query($sql_cmd);
	return $result;
}

function __file_to_base64(String $path){
	$data = file_get_contents($path);
	return base64_encode($data);
}

function __get_filterd_testcases($trid,$tester_id,$document,$ary_verdicts){
	$conn = db_connect();
	$testcase_list = null;
	$sql_cmd = __sqlcmd_get_filterd_testcases($conn,$trid,$tester_id,$document,$ary_verdicts);
	if($result=$conn->query($sql_cmd)){
		$testcase_list = array();
		while($row = $result->fetch_assoc()) {
			$tc = new stdclass();
			$tc->ID=$row["TcID"];
			$tc->Verdict=$row["Verdict"];
			$tc->Comment=$row["Comment"];
			array_push($testcase_list,$tc);
		}
	}
	$conn->close();
	return $testcase_list;
}

function __sqlcmd_get_filterd_testcases($conn,$trid,$tester_id,$document,$ary_verdicts){
	$sql_cmd = sprintf("SELECT `Usr_Exec_Tr_Tc`.TcID,Verdict,Comment 
						FROM `Usr_Exec_Tr_Tc`,
							(SELECT TrID, TcID, MAX(UpdatedTime) as LastUpdatedTime
							 FROM `Usr_Exec_Tr_Tc` GROUP BY TrID, TcID) AS last_records
						WHERE `Usr_Exec_Tr_Tc`.TrID=last_records.TrID AND 
						      `Usr_Exec_Tr_Tc`.TcID=last_records.TcID AND 
						      `Usr_Exec_Tr_Tc`.UpdatedTime=last_records.LastUpdatedTime AND 
						      `Usr_Exec_Tr_Tc`.TrID=\"%s\"",
                    	$trid);
	if($tester_id>=0){
		$sql_cmd.=sprintf(" AND Submitter=\"%s\"", $tester_id);
	}
	if($ary_verdicts){
		$sql_cmd.= " AND (";
		foreach($ary_verdicts as $verdict){
			$ver_str="";
			if($verdict=="P"){
				$ver_str="Passed";
			}
			else if($verdict=="F"){
				$ver_str="Failed";
			}
			else if($verdict=="B"){
				$ver_str="Blocked";
			}
			else if($verdict=="E"){
				$ver_str="Exempted";
			}
			else if($verdict=="I"){
				$ver_str="Indeterminate";
			}
			else{
				$ver_str=$verdict;
			}
			$sql_cmd.=sprintf("Verdict =\"%s\" OR ",$ver_str);
		}
		$sql_cmd=rtrim($sql_cmd,"OR ");
		$sql_cmd.=")";
	}
	if(strtoupper($document)!="ALL"){
		$sql_cmd=sprintf("SELECT results.TcID,results.Verdict,results.Comment FROM `Testcase`,(%s) AS results WHERE `Testcase`.ID=results.TcID AND `Testcase`.Document=\"%s\"",
			$sql_cmd,
			$conn->real_escape_string($document)
		);
	}
	//write_log("__sqlcmd_get_filterd_testcases",$sql_cmd);	
	return $sql_cmd;
}

function __sql_cmd_is_testrun_exist($conn,$tr_name){
	$sql_cmd= sprintf("SELECT EXISTS(SELECT * FROM test_process_assistant.TestRun WHERE Name=\"%s\") AS is_exist",
		$conn->real_escape_string($tr_name));
	return $sql_cmd;
}

function __sql_cmd_update_tr_active($conn,$trid,$active){
	if($active==0){
		$ft="NOW()";
	}
	else{
		$ft="NULL";
	}
	$sql_cmd= sprintf("UPDATE `TestRun` SET Active=\"%s\",FinishedTime=%s WHERE ID=\"%s\"",
		$conn->real_escape_string($_POST['active']),
		$ft,
		$conn->real_escape_string($_POST['trid'])
	);
	return $sql_cmd;
}

function __del_tr_contains_tc($trid){
	$message="";
	$sql_cmd=
	sprintf("Delete from `test_process_assistant`.`Tr_Contains_Tc` Where `TrID`= \"%s\"",
		$trid
	);
	$conn=db_connect();
	try{
		$result=$conn->query($sql_cmd);
		if ($result){
		}
		else{
			$__response_obj->result="Fail";
			$message=mysqli_error($conn);
		}
	}
	catch (Exception $e) {
		$message = "Catch exception: ".$e->getMessage();
	 	write_log("__del_tr_contains_tc",$message);
 	}
	finally{
		$conn->close();
	}
	return $message;
}

function __del_usr_exec_tr_tc($trid){
	$message="";
	$sql_cmd=
	sprintf("Delete from `test_process_assistant`.`Usr_Exec_Tr_Tc` Where `TrID`= \"%s\"",
		$trid
	);
	$conn=db_connect();
	try{
		$result=$conn->query($sql_cmd);
		if ($result){
		}
		else{
			$__response_obj->result="Fail";
			$message=mysqli_error($conn);
		}
	}
	catch (Exception $e) {
		$message = "Catch exception: ".$e->getMessage();
	 	write_log("__del_usr_exec_tr_tc",$message);
 	}
	finally{
		$conn->close();
	}
	return $message;
}

function __del_tr_tc_has_note($trid){
	$message="";
	$sql_cmd=
	sprintf("Delete from `test_process_assistant`.`Tr_Tc_Has_Note` Where `TrID`= \"%s\"",
		$trid
	);
	$conn=db_connect();
	try{
		$result=$conn->query($sql_cmd);
		if ($result){
		}
		else{
			$__response_obj->result="Fail";
			$message=mysqli_error($conn);
		}
	}
	catch (Exception $e) {
		$message = "Catch exception: ".$e->getMessage();
	 	write_log("__del_tr_tc_has_note",$message);
 	}
	finally{
		$conn->close();
	}
	return $message;
}

function __del_testrun($trid){
	$message="";
	$sql_cmd=
	sprintf("Delete from `test_process_assistant`.`TestRun` Where `ID`= \"%s\"",
		$trid
	);
	$conn=db_connect();
	try{
		$result=$conn->query($sql_cmd);
		if ($result){
		}
		else{
			$__response_obj->result="Fail";
			$message=mysqli_error($conn);
		}
	}
	catch (Exception $e) {
		$message = "Catch exception: ".$e->getMessage();
	 	write_log("__del_usr_exec_tr_tc",$message);
 	}
	finally{
		$conn->close();
	}
	return $message;
}

function __del_trs_files_of_testrun($trid){
	global $TRS_UPLOAD_FOLDER;
	$message="";
	$__trs_folder = $TRS_UPLOAD_FOLDER.$trid."/";
	if(is_dir($__trs_folder)){
		try{
			__delete_directory_and_contained_files($__trs_folder);
		}
		catch (Exception $e) {
			$message = "Catch exception: ".$e->getMessage();
		 	write_log("__del_trs_files_of_testrun",$message);
	 	}	
	}
	return $message;
}

function __delete_directory_and_contained_files($dir){
	$it = new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS);
	$files = new RecursiveIteratorIterator($it,RecursiveIteratorIterator::CHILD_FIRST);
	foreach($files as $file) {
	    if ($file->isDir()){
	        rmdir($file->getRealPath());
	    } else {
	        unlink($file->getRealPath());
	    }
	}
	rmdir($dir);
}

function __upload_trs_file(){
	global $TRS_UPLOAD_FOLDER;
	$__response_obj=new stdClass();
	if(isset($_FILES["files"])){
	    $target_dir = $TRS_UPLOAD_FOLDER.$_POST["trid"]."/";
		$__response_obj = __upload_files($target_dir,$_FILES["files"]);    
	}
	else{
	    $__response_obj->result="Fail";
	    $__response_obj->message="The parameter \"files\" does not found.";
	}
	return $__response_obj;
}

function __upload_tested_result_files(){
	global $TESTED_RESULT_FOLDER;
	$__response_obj=new stdClass();
	if(isset($_FILES["files"])){
	    $target_dir = $TESTED_RESULT_FOLDER.$_POST["trid"]."/";
		$__response_obj = __upload_files($target_dir,$_FILES["files"]);   
	}
	else{
	    $__response_obj->result="Fail";
	    $__response_obj->message="The parameter \"files\" does not found.";
	}
	return $__response_obj;
}

function __upload_files($target_dir,$files){
	$__response_obj=new stdClass();
	$file_count = count($files['name']);
	$__response_obj->files=array();
	if (is_dir($target_dir) || mkdir($target_dir, 0777, true)) {
		for($i=0;$i<$file_count;$i++){
			$response_file = new stdClass();
			$file_name = $files['name'][$i];
			$file_tmp_name = $files['tmp_name'][$i];				
			$response_file->basename=basename($file_name);
			$target_file = $target_dir. $response_file->basename;
			$fileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
			// Allow certain file formats
			if($fileType == "xls" || $fileType == "xlsx") {
				if(move_uploaded_file($file_tmp_name, $target_file)){
					$response_file->server_path=$target_file;
					$response_file->result="Pass";				    
				} 
				else {
					$__response_obj->result="Fail";
					$response_file->result="Fail";
					$__response_obj->message="Sorry, there was an error occur while uploading your file.";
				}		    	       
			}
			else{
				 $__response_obj->result="Fail";
				 $response_file->result="Fail";
				$__response_obj->message="Sorry, only xls, xlsx files are allowed.";
			}
			array_push($__response_obj->files,$response_file); 
		}
		if(!isset($__response_obj->result)){
			$__response_obj->result="Pass";
		}
	}
	else{
		$__response_obj->result="Fail";
		 $__response_obj->message='Failed to create folder.';
	}
	return $__response_obj;
}

function __db_add_testcases_into_testrun(){
	$__response_obj = new stdClass();
	$__response_obj->action="__add_testcases_into_testrun";
	if(isset($_POST['trid']) && isset($_POST['trs_files'])){
		$trid = $_POST['trid'];
		$trs_files = $_POST['trs_files'];
		$update_automated=(isset($_POST['update_automated']))?strtoupper($_POST['update_automated'])=="TRUE":FALSE;
		$update_tag=(isset($_POST['update_tag']))?strtoupper($_POST['update_tag'])=="TRUE":FALSE;
		$conn=db_connect();
		$testcase_list=array();
		try{
			foreach($trs_files AS $trs_file){
				$tr = new TRS_Parser($trs_file);
				$testcase_list = array_merge($testcase_list,$tr->getTestcaseList());
			}
			foreach($testcase_list AS $testcase){
				//********** Prepare TCInfo **********
				$tcid = $conn->real_escape_string($testcase["ID"]);
				$title = $conn->real_escape_string($testcase["Title"]);
				$document = $conn->real_escape_string($testcase["Document"]);
				$procedure = $conn->real_escape_string($testcase["Procedure"]);				
				$expected_result = $conn->real_escape_string($testcase["ExpectedResult"]);

				$environment_setup = array_key_exists("Environment_Setup",$testcase)?$conn->real_escape_string(trim($testcase["Environment_Setup"])):null;
				$environment_setup=($environment_setup && strlen($environment_setup)>0)?$environment_setup:null;
				$legacy_id = array_key_exists("Legacy_ID",$testcase)?$conn->real_escape_string(trim($testcase["Legacy_ID"])):null;
				$legacy_id=($legacy_id && strlen($legacy_id)>0)?$legacy_id:null;
				$automated = array_key_exists("Automated",$testcase)?$conn->real_escape_string(trim($testcase["Automated"])):null;
				$automated=($automated && strlen($automated)>0)?$automated:null;
				$tags = array_key_exists("Tag",$testcase)?$conn->real_escape_string(trim($testcase["Tag"])):null;
				$tags=($tags && strlen($tags)>0)?$tags:null;
				// //********** Prepare TCInfo **********

				// //********** Insert data rows of tr_contains_tc table **********
				$sql_cmd=sprintf(
					"INSERT INTO `test_process_assistant`.`Tr_Contains_Tc` (`TrID`, `TcID`) VALUES (\"%s\", \"%s\") ON DUPLICATE KEY UPDATE `TrID`=\"%s\", `TcID`=\"%s\"",
					$trid,
					$tcid,
					$trid,
					$tcid
				);
				if(!($result = $conn->query($sql_cmd))){
					$__response_obj->result = "Fail";
					$__response_obj->message .= mysqli_error($conn)."\n";
					write_log($__response_obj->action,$__response_obj->message);
					continue; //Skip this one
				}
				//********** Insert data rows of tr_contains_tc table **********

				//********** Update Testcase Info to Testcase table **********
				
				//========== Update automated property or not ==========
				if($update_automated){
					if($automated){
						$tc_auto_col_name_string = ",`Automated`";
		                $tc_auto_col_value_string = ",\"".$automated."\"";
		                $tc_auto_sql_string = $tc_auto_col_name_string."=\"".$automated."\"";
		            }
		            else{
		                $tc_auto_col_name_string = ",`Automated`";
		                $tc_auto_col_value_string = ",NULL";
		                $tc_auto_sql_string = $tc_auto_col_name_string."=NULL";
		            }
				}
				else{
					$tc_auto_col_name_string = "";
		            $tc_auto_col_value_string = "";
		            $tc_auto_sql_string = "";
				}
				//========== Update automated property or not ==========

				//========== Update Testcase info ==========
				$sql_cmd = sprintf(
					"INSERT INTO `test_process_assistant`.`Testcase` (`ID`, `Title`, `Document`, `Procedure_`, `ExpectedResult`,`Legacy_ID`,`Environment_Setup` %s) VALUES (\"%s\", \"%s\", \"%s\", \"%s\", \"%s\", %s, %s %s) ON DUPLICATE KEY UPDATE `ID`=\"%s\", `Title`=\"%s\", `Document`=\"%s\", `Procedure_`=\"%s\", `ExpectedResult`=\"%s\", `Legacy_ID`=%s, `Environment_Setup`=%s %s",
					$tc_auto_col_name_string,
					$tcid,
					$title,
					$document,
					$procedure,
					$expected_result,
					($legacy_id)?("\"".$legacy_id."\""):"NULL",
					($environment_setup)?("\"".$environment_setup."\""):"NULL",
					$tc_auto_col_value_string,
					$tcid,
					$title,
					$document,
					$procedure,
					$expected_result,
					($legacy_id)?("\"".$legacy_id."\""):"NULL",
					($environment_setup)?("\"".$environment_setup."\""):"NULL",
					$tc_auto_sql_string
				);
				if(!($result = $conn->query($sql_cmd))){
					$__response_obj->result = "Fail";
					$__response_obj->message = mysqli_error($conn)."\n";
					write_log($__response_obj->action,$__response_obj->message);
				}
				//========== Update Testcase info ==========

				//========== Update Tag info into Tc_Has_Tag table==========
				if($update_tag && $tags){
					$ary_tag = explode('\n',trim($tags,'\r'));
					foreach($ary_tag AS $raw){
						$kv_pair = explode(':',$raw);
						$len = count($kv_pair);
						$tag=null;
						if($len==2){
							$tag=$conn->real_escape_string(rtrim($kv_pair[0]));
							$description=$conn->real_escape_string(rtrim($kv_pair[1]));
							$value=null;
						}
						else if($len==3){
							$tag=$conn->real_escape_string(rtrim($kv_pair[0]));
							$description=$conn->real_escape_string(rtrim($kv_pair[1]));
							$value=$conn->real_escape_string(rtrim($kv_pair[2]));
						}
						if($tag){
							$sql_cmd = sprintf("INSERT INTO `test_process_assistant`.`Tc_Has_Tag`(`TcID`,`Tag`,`Description`,`Value_`) VALUES(\"%s\", \"%s\",\"%s\",%s) ON DUPLICATE KEY UPDATE `TcID`=\"%s\", `Tag`=\"%s\", `Description`=\"%s\", `Value_`=%s",
								$tcid,
								$tag,
								$description,
								($value)?"\"".$value."\"":"NULL",
								$tcid,
								$tag,
								$description,
								($value)?"\"".$value."\"":"NULL"
							);
							if(!($result = $conn->query($sql_cmd))) {
								$__response_obj->result = "Fail";
								$__response_obj->message .= mysqli_error($conn)."\n";
								write_log($__response_obj->action,$__response_obj->message);
							}
						}
					}
				}			
				//========== Update Tag info into Tc_Has_Tag table==========
			}
			//********** Update Testcase Info to Testcase table **********		
			if(!isset($__response_obj->result)){
				$__response_obj->result="Pass";
				$__response_obj->tc_count= count($testcase_list);
			}
		}
		catch (Exception $e) {
			$__response_obj->result = "Fail";
			$__response_obj->message .= "Catch exception: ".$e->getMessage()."\n";
		 	write_log($__response_obj->action,$__response_obj->message);
	 	}
		finally{
			$conn->close();
		}
	}
	return $__response_obj;
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

function __template(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	$conn=db_connect();
	try{
	}
	catch (Exception $e) {
	 	$__response_obj->result = "Fail";
		$__response_obj->message = "Catch exception: ".$e->getMessage();
	 	write_log($__response_obj->action,$__response_obj->message);
 	}
	finally{
		$conn->close();
	}
	return $__response_obj;
}

$response_obj=new stdClass();
if(isset($_POST['action'])) {
	// ************ set_tr_tc_filter ****************
	if($_POST['action'] == 'get_active_users'){
		$response_obj = get_active_users();				
	}
	else if($_POST['action'] == 'export_testrun'){
		$response_obj = export_testrun();				
	}
	else if($_POST['action'] == 'upload_trs_file'){
		$response_obj = __upload_trs_file();
	}
	else if ($_POST['action']== 'upload_tested_result_files'){
		$response_obj = __upload_tested_result_files();
	}
	else if($_POST['action'] == 'create_testrun'){
		$response_obj = create_testrun();
	}
	else if($_POST['action'] == 'add_testcase_to_testrun'){
		$response_obj = __db_add_testcases_into_testrun();
	}
	else if($_POST['action'] == 'find_tr_trs_files'){
		$response_obj = find_tr_trs_files();
	}
	else if($_POST['action'] == 'is_testrun_exist'){
		$response_obj = is_testrun_exist();
	}
	else if($_POST['action'] == 'update_testrun_active'){
		$response_obj = update_testrun_active();
	}
	else if($_POST['action'] == 'delete_testrun'){
		$response_obj = delete_testrun();
	}
	else if ($_POST['action'] == 'import_tested_result'){
		$response_obj = import_tested_result();
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