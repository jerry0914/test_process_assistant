<?php

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

error_reporting(E_ALL);

require_once __DIR__ . '/../vendor/phpoffice/phpspreadsheet/src/Bootstrap.php';

Class TRS_Parser{
	
	private $__config_path="../trs_settings.json";
	private $__config_json;
	private $TestCaseList;
	public function getTestcaseList(){
		return $this->TestCaseList;
	}
	
	function __construct(String $trs_path){
		$this->TestCaseList=array();
		$this->read_config();
		$this->load_trs($trs_path);
	}

	private function read_config(){
		$conf_string = file_get_contents($this->__config_path);
		$this->__config_json = json_decode($conf_string, true);
		//echo json_encode($this->__config_json);
	}

	private function load_trs($input_file_name){
		$sheet_name = $this->__config_json['sheet_name'];
		//echo "sheet_name-\"".$sheet_name."\"\n";
		$first_row = (int) $this->__config_json['first_row'];
		//echo "first_row-\"".$first_row."\"\n";

		$spreadsheet = IOFactory::load($input_file_name);
		if($sheet_name){
			$sheet = $spreadsheet->getSheetByName($sheet_name);
		}
		else{
			$sheet = $spreadsheet->getActiveSheet();
		}
		
		if($sheet){
			//*************** Read Testcases ***************
			$data_rows =  $sheet->getRowIterator($first_row);
			foreach($data_rows AS $row){
				//*************** preread to get data column indexes ***************
				if($row->getRowIndex()==$first_row){
					foreach($row->getCellIterator() AS $cell){
						foreach ($this->__config_json['columns'] AS &$col){
							if($cell->getValue()==$col['text']){
								$col['col_name']=$cell->getColumn();
								//echo "Index[".$col['text']."]=".$col['col_name']."\n";
								write_log("trs_write_preread_debug-1","[".$col['text']."]=".$col['col_name'].";ID=".$col['id']);	
								break;
							}
						}		
					}							
				}
				//*************** preread to get data column indexes ***************
				//*************** Get testcases data ***************
				else{
					$testcase = array();
					foreach ($this->__config_json['columns'] AS &$col){
						// write_log("trs_write_debug-3","Key=".$col['id'].";col_name=".$col['col_name']);				
						if(array_key_exists('col_name',$col)){
							$key=$col['id'];							
							$col_name =$col['col_name'];
							$cell = $row->getCellIterator($col_name,$col_name)->current();
							$val=$cell->getValue();
							$testcase[$key]=$val;
							//Debug Only
							// if($key=="Tag"){
							// 	write_log("trs_write_debug","Tag=".$val);
							// }
							//echo $key."=".$testcase[$key]."\n";							
						}						
					}
					if($testcase["ID"]) //Filter the blank row
					{
						//echo implode("\n",$testcase);
						array_push($this->TestCaseList,$testcase);
					}					
				}				
				//*************** Get testcases data ***************
			}			
		}
		else{
			echo "Can not get sheetData"."\n";
		}
	}	
}

Class Trs_Settings_Json_Generator{
	public $my_json;
	function __construct(){
		$this->my_json=new stdClass();
		$this->my_json->sheet_name='Sheet1';
		$this->my_json->first_row=1;
		$this->my_json->columns = array();
		$col = new stdClass();
		$col->id="ID";
		$col->text="ID";

		array_push($this->my_json->columns,$col);
		$col = new stdClass();
		$col->id="Title";
		$col->text="Title";

		array_push($this->my_json->columns,$col);
		$col = new stdClass();
		$col->id="Document";
		$col->text="Document";

		array_push($this->my_json->columns,$col);
		$col = new stdClass();
		$col->id="Procedure";
		$col->text="Procedure";

		array_push($this->my_json->columns,$col);		
		$col = new stdClass();
		$col->id="ExpectedResult";
		$col->text="Expected Result";

		array_push($this->my_json->columns,$col);
		$col = new stdClass();
		$col->id="Verdict";
		$col->text="Test Case Verdict";

		array_push($this->my_json->columns,$col);
		$col = new stdClass();
		$col->id="Comment";
		$col->text="Test Comment";

		array_push($this->my_json->columns,$col);	
		$col = new stdClass();
		$col->id="Legacy_ID";
		$col->text="Legacy Test Case ID";

		array_push($this->my_json->columns,$col);	
		$col = new stdClass();
		$col->id="Environment_Setup";
		$col->text="Environment / Setup";
		
		array_push($this->my_json->columns,$col);
		$col = new stdClass();
		$col->id="Tag";
		$col->text="Tag";

		array_push($this->my_json->columns,$col);
		$col = new stdClass();
		$col->id="Automated";
		$col->text="Automation Test Steps";

		array_push($this->my_json->columns,$col);
	}

	private function get_json_text(){
		return json_encode($this->my_json);
	}

	public function write_to_config(String $path){
		$config_file = fopen($path,"w") or die("Unable to open file!!");
		fwrite($config_file, $this->get_json_text());
		fclose($config_file);
	}
}
//$tr=new TestRun(__DIR__ ."/../uploads/sample.xlsx");

//************** for trs_settings.json generate only ***********************
//$tsjg = new Trs_Settings_Json_Generator();
//$tsjg->write_to_config("../trs_settings.json");
?>