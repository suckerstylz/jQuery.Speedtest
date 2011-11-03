jQuery(document).ready(function($){
	
	$('.speed-meter').speedometer({ digitalRoll: false });
	
	$('.speedtest .button').bind('click', function(){
		
		if($('.speedtest .foot:visible').length)
		{
			$('.speedtest .foot').slideToggle();
		}
		
		$('.speed-meter').speedometer({ percentage: 0, limit: false, animate: true, digitalRoll: false, timeout: 5 });
		
		spinner($('.speed-output span'), false, false);
		
		//global objects
	
		var starttime,
				endtime,
				dltime,
				linespeedInKbits,
				overallSpeed,
				spinning,
				kbitps = new Object(),
				debug = false;
	
		//new Date object to define start and end time for downloads
			var time = new Date();
	
		/*
			Fancy animation for the numbers reflecting the result during speedtest
		*/
	
			function spinner(elements, changeTo, isDone) {
				
				$(elements).each(function(){
					var el = this;
					var $obj = $(el);
					$obj.css('opacity', '.5');
					var original = $obj.text();
					var spinner, spin, done;
					
					if(!isDone){
						
						spinner = spinning();
						
					} else {
						
						done = setTimeout(function() {
							
							clearInterval(spinning);
							$obj.text(changeTo).css('opacity', '1');
						}, 1000);
						
					}
					
					spin = function() {
						return Math.floor(Math.random() * 9);
					};
					
					spinning = function() {
					
						this = setInterval(function() {
							$obj.text(function() {
								var result = '';
								for (var i = 0; i < original.length; i++) {
									result += spin().toString();
								}
								return result;
							});
						}, 50);
					
					};
					
				});
			}
	
		/*
			Asynchronous Speedtest
		*/
		
			async.series({
				loadOneMegaByte : function(cb){
					getPackage('junk/1mb.zip', new Date().getTime(), cb);
				},
				loadThreeMegaByte : function(cb){
					getPackage('junk/3mb.zip', new Date().getTime(), cb);
				},
				loadFiveMegaByte : function(cb){
					getPackage('junk/5mb.zip', new Date().getTime(), cb);
				}
			},
				//holy callback <3 by Stefan Heckler
				
				function(err, results)
				{
					if(err){
						
						if(debug)	console.error('async Error: ', err);
						
					} else {
						
						if(debug)	console.info('async Succeeded: ');
						
						var averageSpeed = animateSpeed(results, true);
						
						spinner($('.speed-output span'), averageSpeed, true);
						
						return false;
					}
			});
		
		
			function getPackage(path, starttime, cb){
			
				$.ajax({
					url: path,
					cache: false,
					beforeSend: function(){
						
						if(debug) console.info('initializing AJAX request for path ' + path + ' ...');
						
					},
					success: function(data){
						
						var result = { starttime : starttime, endtime : new Date().getTime(), fileSize : data.length };
						animateSpeed(result, false);
						cb(null, result);
							
					},
					error: function(err){
						
						if(debug)	console.error('AJAX request error: ' + err);
						cb(err, null);
						
					}
				});
			
			};
	
	
		/*
			Function to display results
		*/
		
		function animateSpeed(results, isDone){
			
			if(isDone){
			
				$.each(results, function(i, v){
				
					if(v.starttime == v.endtime)
					{
						dltime = 0;
					
					} else {
					
						dltime = Math.ceil(v.endtime - v.starttime);
				
					}
				
					linespeedInKbits = Math.ceil((v.fileSize*8/1024)/(dltime/1000));
				
					kbitps[i] = linespeedInKbits;
				
					/*if(debug){
						console.log('---------------------- New Load ----------------------');
						console.log('Filesize: ' + v.fileSize + ' byte');
						console.log('dl-time: ' + dltime + ' milliseconds');
						console.log('Linespeed: ' + linespeedInKbits + ' kbit/s');
						console.log('Time to complete download for %s kbyte: %d seconds.', v.fileSize/1024, dltime/1000);
					}*/
				
				});
			
			
				if(dltime > 0)
				{
					var overallSpeed = 0;
			
					$.each(kbitps, function(){
				
						overallSpeed += this;
				
					});
			
					var averageSpeed = (overallSpeed/3);
			
					var percentage = (100/20000)*averageSpeed;
			
					if(debug) console.log(percentage);
					
					$('.speed-meter').speedometer({ percentage: Math.round(percentage), limit: false, animate: true, digitalRoll: false });
					$('.speedtest .foot .testresult').html(Math.round(averageSpeed)).parents('.foot').slideToggle();
						
					return averageSpeed;
					
				
				} else {
					if(debug) console.error('Speedtest failed! Start and Endtime of download are the same. localhost?');
				}
			
			} else {
				
				if(results.starttime == results.endtime)
				{
					dltime = 0;
			
				} else {
			
					dltime = Math.ceil(results.endtime - results.starttime);
		
				}
		
				linespeedInKbits = Math.ceil((results.fileSize*8/1024)/(dltime/1000));
		
		
				if(debug){
					console.log('---------------------- New Load ----------------------');
					console.log('Filesize: ' + results.fileSize + ' byte');
					console.log('dl-time: ' + dltime + ' milliseconds');
					console.log('Linespeed: ' + linespeedInKbits + ' kbit/s');
					console.log('Time to complete download for %s kbyte: %d seconds.', results.fileSize/1024, dltime/1000);
				}
				
					if(dltime > 0){
					
					var percentage = (100/20000)*linespeedInKbits;
				
					$('.speed-meter').speedometer({ percentage: Math.round(percentage), limit: false, animate: true, digitalRoll: false, timeout: 30 });
				
				}
			}
		}
		
	});
	
	
	
});