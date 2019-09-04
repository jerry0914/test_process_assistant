<?php 

require_once("Java.inc");
require_once __DIR__ . '/../vendor/aspose.cells/lib/aspose.cells.php';
require_once __DIR__."/settings.php";

use aspose\cells;
use aspose\cells\Workbook;
use aspose\cells\CellsHelper;
use aspose\cells\Color;

class TRS_Writer1{
	private $__config_path="../trs_settings.json";
	private $__config_json;

	function __construct(){
		$this->read_config();
	}

	private function read_config(){
		$conf_string = file_get_contents($this->__config_path);
		$this->__config_json = json_decode($conf_string, true);
	}

	private function get_col_name_by_id($id){
		$found = current(array_filter($this->__config_json['columns'], function($item) {
		    return isset($item['id']) && $id == $item['id'];
		}));
		if($found && isset($found['col_name'])){
			return $found['col_name'];
		}
		else{
			return null;
		}
	}

	public function write_trs($testcase_list,$base_file_name){
		global $TRS_DOWNLOAD_TMP_FOLDER;

		$__response_obj = new stdclass();
		$__response_obj->action="write_trs";
		//$__response_obj->result="Pass";
		$workbook = new Workbook($base_file_name);		
		$sheet_name = $this->__config_json['sheet_name'];
		$first_row = (int) $this->__config_json['first_row'];

		if($sheet_name){
			$sheet = $workbook->getWorksheets()->get($sheet_name);
		}
		else{
			$active_index = $workbook->getActiveSheetIndex();
			$sheet = $workbook->getWorksheets()->get($active_index);
		}
		if($sheet){
			foreach($sheet->getCells()->getRows() AS $row) {
				//***************Start: Read the header column ***************
				if($row->getIndex()==$first_row){
					foreach($row->iterator() AS $cell){
						foreach ($this->__config_json['columns'] AS &$col){
							if($cell->getValue()==$col['text']){
								$col['col_name']=$cell->getColumn();
								if($col['id']=="ID"){
									$tcid_col=$col['col_name'];
								}
								else if($col['id']=="Verdict"){
									$verdict_col=$col['col_name'];
								}
								else if($col['id']=="Comment"){
									$comment_col=$col['col_name'];
								}
								break;
							}
						}	
					}
				}
				//***************End: Read the header column ***************

				//***************Start: fill the data of testcases into cells ***************
				else{
					if($tcid_col && $verdict_col && $comment_col){
						foreach($testcase_list AS $testcase){
							// Find the target row of trs
							$tcid_cell = $row->get($tcid_col);
							if($tcid_cell && $tcid_cell->getValue()==$testcase->ID){
								$verdict_cell=$row->get($verdict_col);
								$comment_cell=$row->get($comment_col);
								if($testcase->Verdict && $verdict_cell){
									$verdict_cell->setValue($testcase->Verdict);
								}
								if($comment_cell){
									if($testcase->Comment ){
										$comment_cell->setValue($testcase->Comment);
									}
									else{
										$comment_cell->setValue(null);
									}
								}
								$__count++;
								break;
							}				
						}
					}
					else{
						break;
					}
				}
				//***************End: fill the data of testcases into cells ***************
			}
			if($tcid_col && $verdict_col && $comment_col){
				$ext_str = date("y-m-d_H-i");
				$output_base_file_parts = pathinfo($base_file_name);
				// $output_file_name=$output_base_file_parts['dirname'].'/'.$output_base_file_parts['filename']."_".$ext_str.".".$output_base_file_parts['extension'];
				$file_name=$output_base_file_parts['filename']."_".$ext_str.".".$output_base_file_parts['extension'];
				$output_file_name=$TRS_DOWNLOAD_TMP_FOLDER.$file_name;
				$workbook->save($output_file_name,cells\SaveFormat::XLSX);
				$__response_obj->result="Pass";
				$__response_obj->file_name=$file_name;
				$__response_obj->output_file=$output_file_name;
				$__response_obj->message=$__count." testcase(s) be exported.";
			}
			else{
				$__response_obj->result="Fail";
				$__response_obj->message = "tcid_col, verdict_col or comment_col name do not defined";
				write_log($__response_obj->action,$__response_obj->message);
			}
		}
		else{
			$__response_obj->result="Fail";
			$__response_obj->message = "TRS worksheet does not found!";
		}		
		$__response_obj->file_name=$file_name;
		$__response_obj->output_file=$output_file_name;
		return $__response_obj;
	}
}
?>