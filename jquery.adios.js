/*
 * Adios jQuery plugin
 * http://github.com/averyvery/jquery.adios
 *
 * Copyright (c) 2012 Doug Avery
 * Dual licensed under the MIT and GPL licenses.
 * Uses the same license as jQuery, see:
 * http://jquery.org/license
 *
 * @version 0.4
 *
 */

;(function(window, document, $, undefined){
	
	'use strict';

	var $document_reference = $(document),
		$window_reference = $(window),

		checkFixedSupport = function(){
			var supports_fixed = supportsFixedPositioning();
			supports_fixed = hasBadFixedSupport(navigator.userAgent) ? false : supports_fixed;
			return supports_fixed;
		},

		supportsFixedPositioning = function(){

			// vars
			var test	= document.createElement('div'),
				old_css_text,
				return_data,
				control = test.cloneNode(false),
				fake = false,
				root,

				// functions
				createBody = function(){
					fake = true;
					return document.documentElement.appendChild(document.createElement('body'));
				},
				setup = function(){
					old_css_text = root.style.cssText;
					root.style.cssText = 'padding:0;margin:0';
					test.style.cssText = 'position:fixed;top:42px';
					root.appendChild(test);
					root.appendChild(control);
				}, 
				breakdown = function(){
					root.removeChild(test);
					root.removeChild(control);
					root.style.cssText = old_css_text;
					fake && document.documentElement.removeChild(root);
				},
				offsetsAreUnequal = function(){
					return test.offsetTop !== control.offsetTop;
				};
				
			root = document.body || createBody();
			setup();
			return_data = offsetsAreUnequal();
			breakdown();
			return return_data;

		},

		hasBadFixedSupport = function(user_agent){
			var return_data = false;
			$.each(browsers_with_bad_fixed_support, function(){
				if(checkUserAgent(this, user_agent)){
					return_data = true;
				};
			});
			return return_data;
		},

		checkUserAgent = function(test_agent, user_agent){
			if(user_agent.match(test_agent.agent_match)){
				var version = user_agent.match(test_agent.version_outer)[0];
				version = version.match(test_agent.version)[0];
				if (version < test_agent.version_min){
					return true;
				}
			}
		},

		browsers_with_bad_fixed_support = {
			iOS : {
				agent_match : /(iPhone|iPad)/,
				version_outer : /OS [0-9]+?_/,
				version : /[0-9]+/,
				version_min : 5
			},
			android : {
				agent_match : /Android/,
				version_outer : /Android [0-9]+?./,
				version : /[0-9]+/,
				version_min : 3
			}
		},

		supports_fixed = checkFixedSupport(),

		Notification = function(config){
			this.setVars(config);
			this.assemble();
			this.open();
			$(window).bind('scroll.jqueryadios resize.jqueryadios', this.proxy('setPositions'));
		};

	Notification.prototype = {

		/* @group setup */
		
			setVars : function(config){
				$.fn.adios.active && $.fn.adios.active.close();
				$.fn.adios.active = this;
				this.options = $.extend({}, config);
			},

			proxy : function(method_name){
				var args = Array.prototype.slice.call(arguments, 1),
					self = this;
				return function(){
					self[method_name] && self[method_name].apply(self, args);
				};
			},

		/* @end */

		/* @group assemble */

			assemble : function(){
				this.createShade();
				this.createBox();
				this.options.buttons && this.addButtons();
			},

			createShade : function(){
				this.$shade = $('<div class="jqueryadios_shade"></div>');
				this.options.shade_transparent && this.$shade.addClass('jqueryadios_shade_transparent');
				this.$shade.css({
					opacity : 0.01,
					position : supports_fixed ? 'fixed' : 'absolute'
				});
				this.bindCallback(this.$shade, this.options.shade_callback);
				this.$shade.appendTo('body');
			},

			bindCallback : function($object, callback){
				if(callback){
					var is_function = typeof callback === 'function',
						callback_prepared = is_function ? callback : eval(callback); 
					$object.bind('click', callback_prepared);
				}
			},

			createBox : function(){
				var header_html = this.options.title ? '<h2 class="jqueryadios_title">' + this.options.title + '</h2>' : '',
					message_html = this.options.message ? '<p class="jqueryadios_message">' + this.options.message + '</p>' : '',
					box_html = 
					'<div class="jqueryadios_box">\
						<div class="jqueryadios_shine"></div>\
						<div class="jqueryadios_content">' +
							header_html +
							message_html +
						'</div>\
					</div>';
				this.$box = $(box_html).appendTo(this.$shade);
			},

			addButtons : function(){
				var self = this;
				this.$buttons = $('<div class="jqueryadios_buttons"></div>').appendTo(this.$box);
				$.each(this.options.buttons, function(){
					self.addButton.call(self, this);
				});
			},

			addButton : function(button){
				var html = button.href ? '<a>' : '<span>',
					classname = button.classname ? 'jqueryadios_button ' + button.classname : 'jqueryadios_button',
					attributes = {
						href : button.href ? button.href : ''
					},
					$button;
				html += button.title ? button.title : '';
				html += button.href ? '</a>' : '</span>';
				$button = $(html, attributes);
				$button.addClass(classname);
				$button.appendTo(this.$buttons);
				this.bindCallback($button, button.callback);
			},
			
			setPositions : function(){
				var window_height = window.innerHeight ? window.innerHeight : $(window).height(),
					window_width = $window_reference.width(),
					window_scroll = $window_reference.scrollTop();
				if(!supports_fixed){
					this.$shade.css({
						top : window_scroll,
						height : window_height
					});
				}
				var top = (window_height / 2) - (this.$box.outerHeight() / 2),
					left = (window_width / 2) - (this.$box.outerWidth() / 2) - 25;
				this.$box.get(0).style.top = top + 'px';
				this.$box.get(0).style.left = left + 'px';
			},

		/* @end */

		/* @group show and hide */

			blockUI : function(){
				$document_reference.bind('touchmove.jqueryadios', this.doNothing);
			},

			unblockUI : function(){
				$document_reference.unbind('touchmove.jqueryadios');
			},

			doNothing : function(event){
				event.preventDefault();
			},

			open : function(){
				this.blockUI();
				this.$shade.fadeTo(300, 1);
				this.$box.addClass('jqueryadios_box_bounce');
				this.setPositions();
			},

			close : function(event){
				event && event.preventDefault && event.preventDefault();
				this.unblockUI();
				this.$shade.fadeOut(200, this.$shade.remove);
				$window_reference.unbind('scroll.jqueryadios resize.jqueryadios');
			},
		
		/* @end */

		/* @group vars */
		
		/* @end */

	};

	$.fn.adios = function(config) {
		var $this = $(this),
			createNotification = function(event){
				var options = {};
				$.extend(
					options, 
					$this.data(), 
					config
				);
				options.cancel_click && event.preventDefault();
				$.fn.adios.create(options);
			};
		this[0] ? $this.click(createNotification) : createNotification();
	}

	$.fn.adios.create = function(config) {
		new Notification(config);
	}

	$.fn.adios.close = function(){
		$.fn.adios.active && $.fn.adios.active.close();
	};

})(window, document, jQuery);
