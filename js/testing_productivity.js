function query_all_testing_productivity(){
    $('#all_users_output_table tbody').html('');
    $('#testing_ouput_workdays').val('');
    const {result,begin_day,end_day,err_msg} = __parser_begin_and_end_date();
    if(result){
        var total_days = __workingDaysBetweenDates(begin_day,end_day);
        $('#testing_ouput_workdays').val('工作日: '+total_days)
        $.ajax({
            url: 'php/testing_productivity.php',
            type: 'POST',
            dataType: 'json',
            data: {
                "action":"query_all_testing_productivity",			
                "begin_day":String(begin_day)+" 00:00:00",
                "end_day":String(end_day)+" 23:59:59"
            },
            success: function(response) {
                if(response.result=="Pass"){                                
                    for (index in response.testing_productivity){
                        var to=response.testing_productivity[index];
                        var _text='';
                        _text+='<tr>';
                        _text+='<td clickable uid=\''+to.UID+'\'><font>'+to.UserName+'</font></td>';
                        _text+='<td><font>'+String(to.Output)+'</font></td>';
                        _text+='<td><font>'+String((to.Output/total_days).toFixed(2))+'</font></td>';
                        _text+='</tr>';
                        $('#all_users_output_table tbody').append(_text);
                    }
                }                    
                else{
                    if(response.message){
                        $('#all_users_output_table tbody').append('<tr><td colspan=3>'+response.message+'</td></tr>');
                    }
                }               
            }
        });
    }
    else{
        alert(err_msg);
    }    
}

function query_individual_testing_productivity(uid,uname=null){
    $('#individual_output_table tbody').html('');
    if (uname==null){
        $('#testing_ouput_tester_name').val('');   
    }
    else{
        $('#testing_ouput_tester_name').val(uname);  
    }     
    const {result,begin_day,end_day,err_msg} = __parser_begin_and_end_date();
    if(result){
        $.ajax({
            url: 'php/testing_productivity.php',
            type: 'POST',
            dataType: 'json',
            data: {
                "action":"query_individual_testing_productivity",			
                "begin_day":String(begin_day)+" 00:00:00",
                "end_day":String(end_day)+" 23:59:59",
                "uid":String(uid)
            },
            success: function(response) {
                if(response.result=="Pass"){                                
                    for (index in response.testing_productivity){
                        var to=response.testing_productivity[index];
                        var _text='';
                        _text+='<tr>';
                        _text+='<td><font>'+to.TrName+'</font></td>';
                        _text+='<td><font>'+String(to.Output)+'</font></td>';
                        _text+='</tr>';
                        $('#individual_output_table tbody').append(_text);
                    }
                }                    
                else{
                    if(response.message){
                        $('#individual_output_table tbody').append('<tr><td colspan=3>'+response.message+'</td></tr>');
                    }
                }               
            }
        });
    }
    else{
        alert(err_msg);
    }    
}


function __parser_begin_and_end_date(){
    var begin_day=null;
    var end_day=null;
    var result=false;
    var err_msg='';    
    if ($("#testing_ouput_date_begin").val()==null)
    {
        err_msg+="Please select the beginning day to query;";
    }
    else{
        begin_day=$("#testing_ouput_date_begin").val();
    }
    if ($("#testing_ouput_date_end").val()==null)
    {
        err_msg+="Please select the endding day to query;";        
    }
    else{
        end_day=$("#testing_ouput_date_end").val();
    }
    if(begin_day!=null && end_day!=null){
        if (begin_day > end_day){
            var tmp = begin_day;
            begin_day = end_day;
            end_day = tmp;
        }
        result=true;
    }
    else{
        result = false;
    }
    return {result,begin_day,end_day,err_msg};
}

function __get_today_string(){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today =  yyyy+'-'+mm+'-'+dd;
    return today
}

function __getMonday_string(d=null) {
    if (d==null){
        d = new Date();
    }
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    var monday = new Date(d.setDate(diff));
    return monday.getFullYear() +'-'+ String(monday.getMonth() + 1).padStart(2, '0') +'-'+ String(monday.getDate()).padStart(2, '0');
}

let __workingDaysBetweenDates = (d0, d1) => {
    /* Two working days and an sunday (not working day) */
    var holidays = [];
    var startDate = __parseDate(d0);
    var endDate = __parseDate(d1);  

    // Validate input
    if (endDate < startDate) {
        return 0;
    }

    // Calculate days between dates
    var millisecondsPerDay = 86400 * 1000; // Day in milliseconds
    startDate.setHours(0, 0, 0, 1);  // Start just after midnight
    endDate.setHours(23, 59, 59, 999);  // End just before midnight
    var diff = endDate - startDate;  // Milliseconds between datetime objects    
    var days = Math.ceil(diff / millisecondsPerDay);

    // Subtract two weekend days for every week in between
    var weeks = Math.floor(days / 7);
    days -= weeks * 2;

    // Handle special cases
    var startDay = startDate.getDay();
    var endDay = endDate.getDay();
        
    // Remove weekend not previously removed.   
    if (startDay - endDay > 1) {
        days -= 2;
    }
    // Remove start day if span starts on Sunday but ends before Saturday
    if (startDay == 0 && endDay != 6) {
        days--;  
    }
    // Remove end day if span ends on Saturday but starts after Sunday
    if (endDay == 6 && startDay != 0) {
        days--;
    }
    /* Here is the code */
    holidays.forEach(day => {
        if ((day >= d0) && (day <= d1)) {
            /* If it is not saturday (6) or sunday (0), substract it */
            if ((__parseDate(day).getDay() % 6) != 0) {
                days--;
            }
        }
    });
    return days;
}
             
function __parseDate(input) {
    // Transform date from text to date
    var parts = input.match(/(\d+)/g);
    // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
}

$(document).ready(function(){
    $("#testing_ouput_date_begin").val(__getMonday_string());
    $("#testing_ouput_date_end").val(__get_today_string());
    query_all_testing_productivity();
    $("#testing_ouput_date_query").click(function(){
		query_all_testing_productivity();
    });
    
    //***************** tr_overview td clicked ***************** 
	$("#all_users_output_table").on("click","tbody>tr>td[clickable]>font",function(){
        $("#all_users_output_table [selected]").removeAttr('selected');
        var uid = $(this).parent().attr('uid');
        $(this).parent().attr('selected',true);
        var uname = $(this).text();
        query_individual_testing_productivity(uid,uname);
    });
});