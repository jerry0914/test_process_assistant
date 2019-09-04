<?php
	include __DIR__."/settings.php";

	function db_connect(){
		global $DB_USER;
		global $DB_PASSWORD;
		global $DB_HOST;
		global $DB_NAME;
		$db_conn=new mysqli($DB_HOST,$DB_USER,$DB_PASSWORD,$DB_NAME);
		// Check connection
		if ($db_conn->connect_error) {
			die("Connection failed: " . $db_conn->connect_error);
		}
		if (!$db_conn->set_charset("utf8")) {
			printf("Error loading character set utf8: %s\n", $db_conn->error);
			exit();
		} 
		//file_put_contents('php://stderr', print_r('Establish connection success.'."\n", TRUE)); //************Debug**********
		return $db_conn;
	}

	function write_log(String $header,String $msg){
		$temp_str = "[".$header."]"." ".$msg."\n";
	 	//echo $temp_str;
	 	file_put_contents('php://stderr', print_r($temp_str, TRUE));
	}

	function mb_strcasecmp($str1, $str2, $encoding = null) {
		if (null === $encoding) {$encoding = mb_internal_encoding();}
		return strcmp(mb_strtoupper($str1, $encoding), mb_strtoupper($str2, $encoding));
	}
	
 ?>