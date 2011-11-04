/*
	
	jQuery Speedtest
	
	jQuery Plugin for testing bandwith linespeed
	
	(c) 2011 Bryan Mewes, dieTaikonauten <http://dietaikonauten.com>
	In case of abuse or illegal redistribution please contact us: <developers@dietaikonauten.com>
	
	You are not allowed to copy any parts of this source
	
	----------------------------------------------------------------------------------------------
	This plugin requires following:
	
	jQuery speedometer by Jacob King
	http://jacob-king.com/demo/speedometer
	
	jQuery async by caolan
	https://github.com/caolan/async
	
	----------------------------------------------------------------------------------------------
	How it workx:
	
	$('.speedtest').Speedtest({
		
		// appearance
		head: 'How fast is your bandwith linespeed?',
		
		// elements 
		startbutton: $('.speedtest-start'),
		gauge: $('.speedtest-gauge'),
		output: $('.speedtest-result'),
		spinners: $('.speedtest-output'),
		result: $('.speedtest-result'),
		
		//junk paths
		pathToFirstJunkFile: "/junk/1mb.zip",
		pathToSecondJunkFile: "/junk/3mb.zip",
		pathToThirdJunkFile: "/junk/5mb.zip",
		
		//speedometer params
		animate: true,
		limit: false,
		percentage: "0",
		digitalRoll: false,
		
		//needleTimeouts for the canvas
		progressNeedleTimeout: "50",
		backToStartNeedleTimeout: "5",
		
		//set true for debugmode
		debug: false 
	});
	
*/

(function($) {
	
	$.Speedtest = function(element, options) {
		
		var speedtest = this,
		$el = $(element),
		element = element,
		dltime,
		linespeedInKbits,
		overallSpeed,
		spinInterval,
		kbitps = new Object(),
		started = false;
	
		speedtest.settings = {};
		
		var defaults = {
			head: 'How fast is your bandwith linespeed?',
			startbutton: $('.speedtest-start'),
			gauge: $('.speedtest-gauge'),
			output: $('.speedtest-result'),
			spinners: $('.speedtest-output span'),
			result: $('.speedtest-result'),
			pathToFirstJunkFile: "/junk/1mb.zip",
			pathToSecondJunkFile: "/junk/3mb.zip",
			pathToThirdJunkFile: "/junk/5mb.zip",
			progressNeedleTimeout: "50",
			backToStartNeedleTimeout: "5",
			animate: true,
			limit: true,
			percentage: "0",
			digitalRoll: false,
			debug: false
		};
	
		
		// init speedtest
			
		speedtest.init = function(){
			
			speedtest.settings = $.extend({}, defaults, options);
			
			$('.head', $el).html(speedtest.settings.head).show();
			
			$(speedtest.settings.gauge).speedometer({ 
				animate: speedtest.settings.animate, 
				limit: speedtest.settings.limit, 
				percentage: speedtest.settings.percentage, 
				digitalRoll: speedtest.settings.digitalRoll 
			});
			
			$(speedtest.settings.startbutton).bind('click', function(){
				
				if(started == true) return false;
				
				$(speedtest.settings.gauge).speedometer({ 
					animate: speedtest.settings.animate, 
					limit: speedtest.settings.limit, 
					percentage: speedtest.settings.percentage, 
					digitalRoll: speedtest.settings.digitalRoll, 
					timeout: speedtest.settings.backToStartNeedleTimeout 
				});
				
				if($(speedtest.settings.result).is(':visible')){
					$(speedtest.settings.result).slideToggle();
				}
				
				spinner(speedtest.settings.spinners, false, false);
				
				setTimeout(function(){
					startAsync();
				}, 500);
				
			});
			
		}
		
		function startAsync(){
			
			started = true;
			
			async.series({
				loadOneMegaByte : function(cb){
					getPackage(speedtest.settings.pathToFirstJunkFile, new Date().getTime(), cb);
				},
				loadThreeMegaByte : function(cb){
					getPackage(speedtest.settings.pathToSecondJunkFile, new Date().getTime(), cb);
				},
				loadFiveMegaByte : function(cb){
					getPackage(speedtest.settings.pathToThirdJunkFile, new Date().getTime(), cb);
				}
			},
			
				function(err, results){
			
				if(err){
				
					if(speedtest.settings.debug) console.error('async Error: ', err);
				
				} else {
				
					if(speedtest.settings.debug) console.info('async Succeeded: ');
					
					var averageSpeed = animateSpeed(results, true);
					
					spinner(speedtest.settings.spinners, averageSpeed, true);
					
					started = false;
					
					return false;
					}
				}
			);
		}
		
		function getPackage(path, starttime, cb){
			
			$.ajax({
				url: path,
				cache: false,
				beforeSend: function(){
					
					if(speedtest.settings.debug) console.info('initializing AJAX request for path ' + path + ' ...');
					
				},
				success: function(data){
					
					var result = { starttime : starttime, endtime : new Date().getTime(), fileSize : data.length };
					animateSpeed(result, false);
					cb(null, result);
					
				},
				error: function(err){
					
					if(speedtest.settings.debug) console.error('AJAX request error: ' + err);
					cb(err, null);
					
				}
			});
			
		};
		
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
					
				});
				
				
				if(dltime > 0)
				{
					var overallSpeed = 0;
					
					$.each(kbitps, function(){
						
						overallSpeed += this;
						
					});
					
					var averageSpeed = (overallSpeed/3);
					
					if(averageSpeed < 18800){
						lsAverage = averageSpeed;
					} else {
						lsAverage = 18800;
					}
					
					var percentage = (100/18800)*lsAverage;
					
					if(speedtest.settings.debug) console.log('Percentage: ' + percentage);
					
					$(speedtest.settings.gauge).speedometer({ 
						percentage: Math.round(percentage), 
						limit: speedtest.settings.limit, 
						animate: speedtest.settings.animate, 
						digitalRoll: speedtest.settings.digitalRoll 
					});
					
					$('span', speedtest.settings.result).html(Math.round(averageSpeed));
					
					$(speedtest.settings.result).slideToggle();
					
					return averageSpeed;
					
					
				} else {
					
					if(speedtest.settings.debug) console.error('Speedtest failed! Start and Endtime of download are equal. localhost?');
					
				}
				
		} else {
			
			if(results.starttime == results.endtime)
			{
				dltime = 0;
				
			} else {
				
				dltime = Math.ceil(results.endtime - results.starttime);
				
			}
			
			linespeedInKbits = Math.ceil((results.fileSize*8/1024)/(dltime/1000));
			
			
			if(speedtest.settings.debug){
				console.log('---------------------- New Load ----------------------');
				console.log('Filesize: ' + results.fileSize + ' byte');
				console.log('dl-time: ' + dltime + ' milliseconds');
				console.log('Linespeed: ' + linespeedInKbits + ' kbit/s');
				console.log('Time to complete download for %s kbyte: %d seconds.', results.fileSize/1024, dltime/1000);
			}
			
			if(dltime > 0){
				
				if(linespeedInKbits < 18800){
					lsTemp = linespeedInKbits;
				} else {
					lsTemp = 18800;
				}
				
				var percentage = (100/18800)*lsTemp;
				
				$(speedtest.settings.gauge).speedometer({ 
					percentage: Math.round(percentage), 
					limit: speedtest.settings.limit, 
					animate: speedtest.settings.animate, 
					digitalRoll: speedtest.settings.digitalRoll, 
					timeout: speedtest.settings.progressNeedleTimeout 
				});
				
			}
		}
	}

		var spinner = function(elements, average, isDone) {
			
			var spinner, spin, done;
			
			clearInterval(spinInterval);
			
			if(!isDone){
				
				$(elements).each(function(){
				
					var obj = $(this);
				
					obj.css('opacity', '.5');
				
					var original = obj.text();
					this.spinInterval = setInterval(function(){
						
						obj.text(function(){
							
							var result = '';
							
							for(var i = 0; i < original.length; i++) {
								
								result += Math.floor(Math.random() * 9).toString();
								
							}
							
							return Math.round(result);
							
						});
						
					}, 50);
			
				});
				
			} else {
				
				var stringNumber = Math.round(average).toString();
				
				$(elements).each(function(index){
					
					clearInterval(this.spinInterval);
					$(this).text('0');
					
				});
				
				var offset = ((stringNumber.length - 6)*-1);
				
				for(var i = 0; i < stringNumber.length; i++){
					$(speedtest.settings.spinners).reverse().eq( i + offset ).text(+stringNumber.charAt(i));
					if(speedtest.settings.debug) console.log($(speedtest.settings.spinners).reverse().eq( i + offset ).text(+stringNumber.charAt(i)));
				}
				
				$(speedtest.settings.spinners).css('opacity', '1');
				
			}
			
		}
		
		$.fn.reverse = [].reverse;
		
		speedtest.init();
	}
	
	$.fn.Speedtest = function(options){
		
		return this.each(function(){
			
			if(undefined == $(this).data('Speedtest')){
				
				var speedtest = new $.Speedtest(this, options);
				
				$(this).data('Speedtest', speedtest);
				
			}
			
		});
	
	}
	
})(jQuery);