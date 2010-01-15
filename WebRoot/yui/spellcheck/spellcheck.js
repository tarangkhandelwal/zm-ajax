/*
 * ***** BEGIN LICENSE BLOCK *****
 * Zimbra Collaboration Suite Web Client
 * Copyright (C) 2008 Zimbra, Inc.
 * 
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.2 ("License"); you may not use this file except in
 * compliance with the License.  You may obtain a copy of the License at
 * http://www.zimbra.com/license.
 * 
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied.
 * ***** END LICENSE BLOCK *****
 */
/*
Copyright (c) 2007, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
version: 2.3.1
*/
/*
Copyright (c) 2007, Yahoo! Inc. All rights reserved.
Code licensed under the BSD License:
http://developer.yahoo.net/yui/license.txt
*/
function enableSpellCheck(myEditor) {
    var Dom = YAHOO.util.Dom,
        Event = YAHOO.util.Event,
        Lang = YAHOO.lang;

    var _handleWindowClose = function() {
    };

    var _handleWindow = function() {
        this.nodeChange();
        var el = this.currentElement[0],
        win = new YAHOO.widget.EditorWindow('spellcheck', {
            width: '170px'
        }),
        body = document.createElement('div');

        var list = '';
        //Change this code to suit your backend checker
        for (var i = 0; i < this._spellData.length; i++) {
            if (el.innerHTML == this._spellData[i].word) {
                for (var s = 0; s < this._spellData[i].suggestions.length; s++) {
                    list = list + '<li title="Replace (' + this._spellData[i].word + ') with (' + this._spellData[i].suggestions[s] + ')">' + this._spellData[i].suggestions[s] + '</li>';
                }
            }
        }
		if (list) {
			body.innerHTML = '<strong>Suggestions:</strong><br>';
			var ul = document.createElement('ul');
			ul.className = 'yui-spellcheck-list';
			body.appendChild(ul);
			ul.innerHTML = list;
		} else {
			body.innerHTML = "No suggestions"
		}

		Event.on(ul, 'click', function(ev) {
            var tar = Event.getTarget(ev);
            Event.stopEvent(ev);
            if (this._isElement(tar, 'li')) {
                el.innerHTML = tar.innerHTML;
                Dom.removeClass(el, 'yui-spellcheck');
                Dom.addClass(el, 'yui-non');

                var next = Dom.getElementsByClassName('yui-spellcheck', 'span', this._getDoc().body)[0];
                if (next) {
                    this.STOP_NODE_CHANGE = true;
                    this.currentElement = [next];
                    _handleWindow.call(this);
                } else {
                    this.checking = false;
                    this.toolbar.set('disabled', false);
                    this.closeWindow();
                }
                this.nodeChange();
            }
        }, this, true);

        this.on('afterOpenWindow', function() {
            this.get('panel').syncIframe();
            var l = parseInt(this.currentWindow._knob.style.left, 10);
            if (l === 40) {
               this.currentWindow._knob.style.left = '1px';
            }
        }, this, true);

        win.setHeader('Spelling Suggestions');
        win.setBody(body);
        this.openWindow(win);


    };

    /* {{{ Override _handleClick method to keep the window open on click */
    myEditor._handleClick = function(ev) {
        if (this._isNonEditable(ev)) {
            return false;
        }
        this._setCurrentEvent(ev);
        var tar =Event.getTarget(ev);
        if (this.currentWindow) {
            if (!Dom.hasClass(tar, 'yui-spellcheck')) {
                this.closeWindow();
            }
        }
        if (!Dom.hasClass(tar, 'yui-spellcheck')) {
            if (YAHOO.widget.EditorInfo.window.win && YAHOO.widget.EditorInfo.window.scope) {
                YAHOO.widget.EditorInfo.window.scope.closeWindow.call(YAHOO.widget.EditorInfo.window.scope);
            }
        }
        if (this.browser.webkit) {
            var tar =Event.getTarget(ev);
            if (this._isElement(tar, 'a') || this._isElement(tar.parentNode, 'a')) {
                Event.stopEvent(ev);
                this.nodeChange();
            }
        } else {
            this.nodeChange();
        }
    };
    /* }}} */

    myEditor.checking = false;
    myEditor._defaultToolbar.buttons[10].buttons[2] = {
      type: 'push',
      label: 'Check Spelling',
      value: 'spellcheck'
    };
    myEditor._checkSpelling = function(o) {
        //Change this code to suit your backend checker
        var data = eval('(' + o.responseText + ')');
		if (!data || !data.available) {
			alert('The spell checking service is unavailable.');
			this.endSpellCheck();
		} else if (!data.data.length) {
			alert('The spelling is correct.');
			this.endSpellCheck();
		} else {
			var html = this._getDoc().body.innerHTML;
			for (var i = 0; i < data.data.length; i++) {
				html = html.replace(data.data[i].word, '<span class="yui-spellcheck">' + data.data[i].word + '</span>');
			}
			this.setEditorHTML(html);
			this._spellData = data.data;
		}
	};

    myEditor.on('windowspellcheckClose', function() {
        _handleWindowClose.call(this);
    }, myEditor, true);

    myEditor.on('editorMouseDown', function() {
        var el = this._getSelectedElement();
        if (Dom.hasClass(el, 'yui-spellcheck')) {
            this.currentElement = [el];
            _handleWindow.call(this);
            return false;
        }
    }, myEditor, true);
    myEditor.on('editorKeyDown', function(ev) {
        if (this.checking) {
            //We are spell checking, stop the event
            Event.stopEvent(ev.ev);
        }
    }, myEditor, true);
    myEditor.on('afterNodeChange', function() {
        this.toolbar.enableButton('spellcheck');
        if (this.checking) {
            this.toolbar.set('disabled', true);
            this.toolbar.getButtonByValue('spellcheck').set('disabled', false);
            this.toolbar.selectButton('spellcheck');
        }
    }, myEditor, true);
	myEditor.startSpellCheck = function() {
		if (!this.checking) {
			this.checking = true;
			var body = myEditor._getDoc().body;
			document.getElementById("SpellCheckData").value = body.textContent || body.innerText; // FF uses textContent, IE uses innerText
			YAHOO.util.Connect.setForm('SpellCheckForm', false, null);
			this._conn = YAHOO.util.Connect.asyncRequest('POST', '/zimbra/h/checkspelling', {
				success: this._checkSpelling,
				failure: function() {},
				scope: this
			}, null);
		}
	}
	myEditor.endSpellCheck = function() {
		if (this.checking) {
			this.checking = false;
			var el = Dom.getElementsByClassName('yui-spellcheck', 'span', this._getDoc().body);
			//More work needed here for cleanup..
			Dom.removeClass(el, 'yui-spellcheck');
			Dom.addClass(el, 'yui-none');
			this.toolbar.set('disabled', false);
			this.nodeChange();
		}
	}
	myEditor.on('toolbarLoaded', function() {
        this.toolbar.on('spellcheckClick', function() {
			if (!this.checking) {
				this.startSpellCheck();
			} else {
				this.endSpellCheck();
			}
			return false;
        }, this, true);
    }, myEditor, true);
};