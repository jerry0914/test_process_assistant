<?php
require_once __DIR__."/common_lib.php";
include __DIR__."/settings.php";


function commit_hint(){
	$__response_obj = new stdClass();
	$__response_obj->action=$_POST['action'];
	$conn = db_connect();
	if(isset($_POST['tcid']) && isset($_POST['updater']) && isset($_POST['message'])){
		if(isset($_POST['hyper_link'])){
			$sql_cmd = __sqlcmd_commit_hint($conn,$_POST['tcid'],$_POST['message'],$_POST['updater'],$_POST['hyper_link']);
		}
		else{
			$sql_cmd = __sqlcmd_commit_hint($conn,$_POST['tcid'],$_POST['message'],$_POST['updater']);
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

function update_testcase(){
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
    //********** Update Testcase Info to Testcase table **********	
}

function modify_tags($tcid,$tags){
    $__response_obj = new stdClass();
    $__response_obj->action=$_POST['action'];
    $conn = db_connect();
    if(isset($_POST['tcid']) && $_POST['tags']){
        if(__remove_all_tags_of_testcase($conn,$_POST['tcid'])){
            $sql_cmd = __sqlcmd_update_tags($conn,$_POST['tcid'],$_POST['tags']);
            
        }
        else{
            $__response_obj->result="Fail";
            $__response_obj->message="Could not reset tags of tcid:"+$_POST['tcid']+$conn->error;
        }        
    }
    else{
        $__response_obj->result="Fail";
        $__response_obj->message=$conn->error;
    }
    else{
    $__response_obj->result="Fail";
    $__response_obj->message="Not enough parameters are given!";
    }
    $conn->close();
    return $__response_obj;
}

function __remove_all_tags_of_testcase($conn,$tcid){
    $result=false;
    $sql_cmd = __sqlcmd_remove_all_tags_of_testcase($conn);
    $result=$conn->query($sql_cmd);	
    return $result;
}

function get_tags_of_testcase(){
    $__response_obj = new stdClass();
    $__response_obj->action=$_POST['action'];
    $conn = db_connect(); 
    if(isset($_POST['tcid'])){               
        $sql_cmd = __sqlcmd_get_tags_of_testcase($conn,$_POST['tcid']);
        $result=$conn->query($sql_cmd);	
        if ($result->num_rows > 0) {
            $__response_obj->result="Pass";
            $__response_obj->tags=array();
            while($row = $result->fetch_assoc()) {
                $tag = new stdClass();
                $tag->Text=$row["Tag"];
                $tag->Description=$row["Description"];
                $tag->Value=$row["Value_"];
                array_push($__response_obj->tags,$tag);
            }
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
    return $__response_obj;
}

function __sqlcmd_update_tags($conn,$tcid,$tags){
    $sql_cmd = "INSERT INTO `test_process_assistant`.`Tc_Has_Tag`(`TcID`,`Tag`,`Description`,`Value_`) VALUES";
    foreach($tag as $tags){
        $values_cmd=sprintf("(\"%s\", \"%s\",\"%s\",%s) ON DUPLICATE KEY UPDATE `TcID`=\"%s\", `Tag`=\"%s\", `Description`=\"%s\", `Value_`=%s,",
            $conn->real_escape_string($tcid),
            $conn->real_escape_string($tag->text),
            $conn->real_escape_string($tag->$description),
            ($tag->value)?"\"".$conn->real_escape_string($value)."\"":"NULL",
            $conn->real_escape_string($tcid),
            $conn->real_escape_string($tag->text),
            $conn->real_escape_string($tag->$description),
            ($tag->value)?"\"".$conn->real_escape_string($value)."\"":"NULL"
        );
        $sql_cmd.=$values_cmd;
    }
    return rtrim($sql_cmd,',');
}

function __sqlcmd_commit_hint($conn,$tcid,$message,$updater,$hyper_link=null){
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

function __sqlcmd_remove_all_tags_of_testcase($conn,$tcid){
    $sql_cmd = sprintf("DELETE FROM test_process_assistant.Tc_Has_Tag WHERE TcID='%s'",
		$conn->real_escape_string($tcid),
	);
	return $sql_cmd;
}

function __sqlcmd_get_tags_of_testcase($conn,$tcid){
    $sql_cmd = sprintf("SELECT * FROM test_process_assistant.Tc_Has_Tag WHERE TcID='%s'",
		$conn->real_escape_string($tcid),
	);
	return $sql_cmd;
}
 


$response_obj=new stdClass();
if(isset($_POST['action'])) {
	// ************ commit_hint ****************
	if($_POST['action'] == 'commit_hint'){
		$response_obj = commit_hint();			
    }
    // ************  ****************
	else if ($_POST['action']=='123'){
		
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