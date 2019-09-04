<?php

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
include __DIR__."/settings.php";

class TRS_Writer{
	private $__config_path="../trs_settings.json";
	private $__config_json;


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

	function __construct(){
		$this->read_config();
	}

	public function write_trs($testcase_list,$output_base_file_name){
		$__response_obj = new stdclass();
		$__response_obj->action="write_trs";
		$__count=0;
		global $TRS_DOWNLOAD_TMP_FOLDER;

		$sheet_name = $this->__config_json['sheet_name'];
		$first_row = (int) $this->__config_json['first_row'];
		$spreadsheet = IOFactory::load($output_base_file_name);
		if($sheet_name){
			$sheet = $spreadsheet->getSheetByName($sheet_name);
		}
		else{
			$sheet = $spreadsheet->getActiveSheet();
		}		
		if($sheet){
			//*************** Read the header column ***************
			$header_row = $sheet->getRowIterator($first_row,$first_row)->current();
			foreach($header_row->getCellIterator() AS $cell){
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
			//*************** Read the header column ***************
			if($tcid_col && $verdict_col && $comment_col){
				foreach($testcase_list AS $testcase){
					// Find the target row of trs
					foreach ($sheet->getRowIterator() AS $row){
						$tcid_cell = $row->getCellIterator($tcid_col,$tcid_col)->current();
						if($tcid_cell && $tcid_cell->getValue()==$testcase->ID){
							$verdict_cell=$row->getCellIterator($verdict_col,$verdict_col)->current();
							$comment_cell=$row->getCellIterator($comment_col,$comment_col)->current();
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
				//$ext_str = new DateTime('now')->format("yy-mm-dd_HH-ii");
				$ext_str = date("y-m-d_H-i");
				$output_base_file_parts = pathinfo($output_base_file_name);
				// $output_file_name=$output_base_file_parts['dirname'].'/'.$output_base_file_parts['filename']."_".$ext_str.".".$output_base_file_parts['extension'];
				$file_name=$output_base_file_parts['filename']."_".$ext_str.".".$output_base_file_parts['extension'];
				$output_file_name=$TRS_DOWNLOAD_TMP_FOLDER.$file_name;				
				$writer=IOFactory::createWriter($spreadsheet,'Xlsx');
				$writer->save($output_file_name);
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
		return $__response_obj;
	}

	private function read_config(){
		$conf_string = file_get_contents($this->__config_path);
		$this->__config_json = json_decode($conf_string, true);
	}
}
?>