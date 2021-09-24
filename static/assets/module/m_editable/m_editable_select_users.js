/**
 * 人员多选
 * Created by wrb on 2019/12/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editable_select_users",
        defaults = {
            type:1,//1==默认触发，2=直接展示
            doType:1,//1=默认，2=设计文件校审
            postParam:{},
            value:null,
            isBaBieUserId:false,//是否value为巴别鸟ID
            isCookies:false,
            options:{},//popover属性
            controlClass:'',
            closed:null,
            completed:null,
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;
        this._cookiesMark = 'cookiesData_productionUserSelection';
        this._cookiesMarkId = this._currentCompanyUserId;
        if(this.settings.postParam && this.settings.postParam.projectId)
            this._cookiesMarkId = this._cookiesMarkId+'_'+this.settings.postParam.projectId;

        this._userList = null;
        this._targetEle = null;

        this._selectedUser = [];//选中的人员
        this._selectedUserInitText = '';//初始化选择的人员文本值
        this._isEntering = false;//是否正在输入
        this._lastEnterText = '';//最近输入的字符
        this._lastEnterPos = null;//最近输入的光标位置

        this._defaultOptions = {
            type : 3,
            placement : 'bottom',
            popoverClass : 'full-width',
            hideElement:true
        };
        this._uuid = UUID.genV4().hexNoDelim;//targetId
        this._inputId = 'userChooser_'+this._uuid;


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderInputPopover();
        }
        ,renderInputPopover:function () {
            var that = this;
            var html = template('m_editable/m_editable_select_users', {
                inputId:that._inputId,
                controlClass:that.settings.controlClass
            });

            var renderFun = function ($popover) {
                that.getUserData(function () {
                    that.setCaret();

                    //初始化文本值
                    if(that.settings.value){
                        $.each(that.settings.value,function (i,item) {
                            that._selectedUserInitText+=item.text+';';
                        });
                        that._selectedUser = that.settings.value;
                        $popover.find('input[name="userChooser"]').val(that._selectedUserInitText);
                    }
                    if(that.settings.type==2){
                        that.inputBlurFun($popover);
                    }
                    if(that.settings.completed)
                        that.settings.completed($popover,that._userList);
                });
            };

            if(that.settings.type==2){

                $(that.element).html(html);
                that._targetEle = $(that.element);
                renderFun($(that.element));

            }else{
                var options = {};
                options = $.extend(that._defaultOptions, that.settings.options);
                if(options.type==3){
                    options.popoverClass += ' editable-inline ';
                }
                options.content = html;
                options.targetNotQuickCloseArr = ['m-editable-select-users','m-editable-input','users-chooser-popover'];
                options.closed = function ($popover) {

                    var selectedUser = that.confirmUser();

                    var text = $.trim($popover.find('input[name="userChooser"]').val());
                    if(text==that._selectedUserInitText){//未作变化
                        that.settings.closed(false,$popover);
                    }else{
                        that.settings.closed(selectedUser,$popover);
                    }
                    console.log(selectedUser);
                };
                options.renderedCallBack = function ($popover) {
                    that._targetEle = $popover;
                    renderFun($popover);
                };
                $(that.element).m_floating_popover(options,true);
            }

            return false;
        }
        ,renderSelectList:function (keyword) {
            var that = this;
            var list = that._userList;
            var $content = $('<ul class="dropdown-menu pt-relative dp-block">');

            if(list==null || list.length==0)
                return;

            if(keyword=='' && that.settings.isCookies){
                $content.append('<li class="title">最近输入</li>');
                list = that.filterDataNotIn();
            }else if(keyword=='' && !that.settings.isCookies){
                $content.append('<li class="title">可能要找的人</li>');
                list = that.matchQuery(that._userList,keyword);
            }else{
                $content.append('<li class="title">可能要找的人</li>')
                list = that.matchQuery(that._userList,keyword);
            }
            if(list && list.length>0){
                $.each(list,function (i,item) {
                    $content.append('<li><a href="javascript:;" data-id="'+item.id+'">'+item.text+'</a></li>')
                });
            }else{
                if($('.m-floating-popover.users-chooser-popover').length>0)
                    that._targetEle.find('input').m_floating_popover('closePopover',1);//关闭浮窗
                return;
            }

            var selectUserFun = function () {
                $('.m-floating-popover.users-chooser-popover ul.dropdown-menu li a').on('click',function(){
                    var name = $(this).text()+';';
                    var userName = $(this).text();
                    var companyUserId = $(this).attr('data-id');
                    var ele = document.getElementById(that._inputId);
                    var position = $('#'+that._inputId).getCurPos();
                    var text = ele.value;
                    var curText = text.substring(0,position);

                    //选中的人员预存到集合
                    //判断人员是否已选择
                    var dataItem = getObjectInArray(that._selectedUser,companyUserId);

                    if(dataItem==null){

                        that._selectedUser.push({id:companyUserId,text:userName});
                        that.insertAtCaret(ele,name);
                    }

                    var newText = '',enterFirstIndex = 0,enterLastIndex = 0;

                    if(that._isEntering==true || that._lastEnterText!=''){

                        if(curText.indexOf(';')>-1){//中间输入

                            enterFirstIndex = curText.lastIndexOf(';')+1;
                            enterLastIndex = position;

                        }else{//文本前面输入

                            enterFirstIndex = 0;
                            enterLastIndex = position;
                        }
                        text = ele.value;//插入人员字符后重新获取
                        newText = text.substring(0,enterFirstIndex)+text.substring(enterLastIndex,text.length);
                        //中间输入插入人员字符后存在‘;;’
                        newText = newText.replaceAll(';;',';');
                        if(newText.substring(0,1)==';'){
                            newText = newText.substring(1,text.length);
                        }
                        if(that._isEntering==false && that._lastEnterText!=''){//中间输入-存在最近输入的匹配字符，则删掉
                            newText = newText.replaceAll(that._lastEnterText+';','');
                        }
                        ele.value = newText;
                    }

                    //console.log('enterFirstIndex==='+enterFirstIndex+'//enterLastIndex==='+enterLastIndex+'//newText==='+newText);
                    var newPos = position+name.length - (enterLastIndex-enterFirstIndex);
                    $('#'+that._inputId).setCurPos(newPos,newPos);
                    that._isEntering = false;
                    that._lastEnterText = '';
                    that._lastEnterPos = null;
                    that._isSelectuser = true;
                    that.confirmUser();//重新检查人员是否正确
                    if(keyword!=''){
                        var t = setTimeout(function () {//设置timeout,避免上面处理时触发了keyup又出来浮窗
                            that._targetEle.find('input').m_floating_popover('closePopover',1);//关闭浮窗
                            clearTimeout(t);
                        },100);

                    }
                });
            };

            if($('.m-floating-popover.users-chooser-popover').length>0){
                $('.m-floating-popover.users-chooser-popover ul.dropdown-menu').html($content.html());
                selectUserFun();
            }else{
                that._targetEle.find('input').m_floating_popover({
                    content: $content.prop('outerHTML'),
                    placement: 'bottomLeft',
                    popoverClass:'users-chooser-popover z-index-layer',
                    popoverStyle:{'border':'0','box-shadow':'none'},
                    clearOnInit:false,
                    isTargetPositionCenter:false,
                    renderedCallBack: function ($popover) {

                        selectUserFun();
                    }
                }, true);
            }
        }
        //过滤不存在的数据
        ,filterDataNotIn:function () {
            var that = this;
            var cookiesData = getProjectParamCookies(that._cookiesMark,that._cookiesMarkId);
            var userList = null;
            if(!isNullOrBlank(cookiesData)){
                userList = cookiesData.userList;
            }
            var newData = [];
            if(!isNullOrBlank(userList) && userList.length>0){

                if(that._userList && that._userList.length>0){
                    $.each(userList,function (i,item) {
                        var isExist = false;
                        $.each(that._userList,function (ci,citem) {
                            if(citem.id==item.id){
                                isExist = true;
                                return false;
                            }
                        });
                        if(isExist)
                            newData.push(item);
                    });
                    return newData;

                }else{
                    return null;
                }

            }else{
                return null;
            }
        }
        //关键字(拼音)匹配
        ,matchQuery:function (list,keyword) {
            var that = this;
            var newList = [], datas = [];
            if(!isNullOrBlank(keyword)){//存在关键字
                $.each(list,function (i,item) {
                    var newItem = that.matchCustom({term:keyword},item);
                    if(!isNullOrBlank(newItem))
                        newList.push(newItem);
                });
                if(newList==null || newList.length==0){
                    datas = [];
                }else{
                    datas = newList
                }
            }else{
                datas = list;
            }

            return datas;
        }
        //自定义模糊查询(引用select2)
        ,matchCustom:function (params,data) {
            function stripDiacritics (text) {
                // Used 'uni range + named function' from http://jsperf.com/diacritics/18
                function match(a) {
                    return a;
                }
                return text.replace(/[^\u0000-\u007E]/g, match);
            }
            //支持中文拼音搜索
            var original = '';
            //搜索输入的字母
            var term = stripDiacritics(params.term).toUpperCase();
            if (stripDiacritics(data.text).toPinYin != undefined){
                original = stripDiacritics(data.text).toPinYin().toString().indexOf(term);
                if(original==-1){
                    //此处是在中文没有匹配时，匹配对应的拼音
                    original = stripDiacritics(data.text).toUpperCase().indexOf(term);
                }
            }
            // 修改
            if (original> -1) {
                return data;
            }
            return null;
        }
        //获取数据
        ,getUserData:function (callBack) {
            var that = this;

            if(that._userList){
                if(callBack)
                    callBack();
            }else{
                var option={};
                option.url=restApi.url_getProjectPartMember;
                option.postData = {};
                if(that.settings.postParam)
                    $.extend(option.postData, that.settings.postParam);

                m_ajax.postJson(option,function (response) {
                    if(response.code=='0'){

                        var newDataList = [];
                        $.each(response.data,function (i,item) {

                            if(that.settings.isBaBieUserId){
                                newDataList.push({id:item.baBieUserId,text:item.userName,companyUserId:item.id,baBieUserId:item.baBieUserId});
                            }else{
                                newDataList.push({id:item.id,text:item.userName,companyUserId:item.id,baBieUserId:item.baBieUserId});
                            }

                        });
                        that._userList = newDataList;

                        if(callBack)
                            callBack();

                    }else {
                        S_toastr.error(response.info);

                    }
                });
            }


        }
        ,insertAtCaret:function (textObj, textFieldValue) {
            if (document.all) {
                if (textObj.createTextRange && textObj.caretPos) {
                    var caretPos = textObj.caretPos;
                    caretPos.text = caretPos.text.charAt(caretPos.text.length - 1) == '   ' ? textFieldValue + '   ' : textFieldValue;
                } else {
                    textObj.value = textFieldValue;
                }
            } else {
                if (textObj.setSelectionRange) {
                    var rangeStart = textObj.selectionStart;
                    var rangeEnd = textObj.selectionEnd;
                    var tempStr1 = textObj.value.substring(0, rangeStart);
                    var tempStr2 = textObj.value.substring(rangeEnd);
                    textObj.value = tempStr1 + textFieldValue + tempStr2;
                } else {
                    S_toastr.error('当前浏览器不支持 HTMLInputElement.setSelectionRange ！');
                }
            }
        }
        ,setCaret:function () {
            var that = this;

            var getSelectText = function () {
                var selectTxt = '';
                if(document.selection) {
                    selectTxt = document.selection.createRange().text;
                } else {
                    selectTxt = document.getSelection();
                }
                return selectTxt.toString();
            };

            that._targetEle.find('input').bind('input select click keyup',function(ev){
                //console.log('input select click keyup');
                var $this = $(this);
                if (this.createTextRange) {
                    this.caretPos = document.selection.createRange().duplicate();
                }
                var position = $this.getCurPos();
                var text = $this.val();

                var text1 = text.substring(0,position);
                var text2 = text.substring(position,text.length);

                //鼠标左键、鼠标滚轮、鼠标右键
                if (ev.button == 0 || ev.button == 1 || ev.button == 2 || ev.keyCode == 37|| ev.button == 39) {

                    that._isEntering = false;
                }
                //console.log('text=='+text+'/position=='+position);
                //console.log('ev.keyCode=='+ev.keyCode);
                if(that._isEntering == true){

                    //console.log('Entering');
                    that._lastEnterText = '';//获取最近输入字符
                    that._lastEnterPos = position;

                    if(position==text.length){//光标停在最后

                        //判断是否已存在人员
                        if(text.indexOf(';')>-1){
                            that._lastEnterText = text.substring(text.lastIndexOf(';')+1,text.length);
                        }else{
                            that._lastEnterText = text;
                        }

                    }else{//光标停在内容中间

                        //创建一个间隔分号
                        //判断输入第一个字符后面是否是‘;’,否则输入后插入‘;’
                        if(((text1.substring(text1.length-1,text1.length)!=';' && text1.substring(text1.length-2,text1.length-1)==';' )
                            || position==1) && text2.substring(0,1)!=';' ){

                            //创建一个间隔分号
                            $this.val(text1+';'+text2);
                            that._lastEnterText = text1.substring(text1.length-1,text1.length);
                            $this.setCurPos(position,position);

                        }else{

                            that._lastEnterText = text1.substring(text1.lastIndexOf(';')+1,text1.length);
                        }
                    }

                }else{

                    //重新光标定位时，检查字符是否正确
                    if(text.indexOf(';;')>-1){

                        $this.val(text.replaceAll(';;',';'));

                    }else if(text.substring(0,1)==';'){

                        $this.val(text.substring(1,text.length));
                    }
                    //that.confirmUser();
                    var selectTxt = getSelectText();
                    text = $this.val();
                    text1 = text.substring(0,position);
                    text2 = text.substring(position,text.length);

                    //光标定位
                    that._isEntering = false;
                    var notDealWith = false;
                    if(!(text.indexOf(';')>-1)){//光标定位最后
                        $this.focus();
                    }else{

                        //光标定位在第一位
                        if(position==0 && (selectTxt=='' || (selectTxt!='' && selectTxt.indexOf(';')>-1 && selectTxt.substring(selectTxt.length-1,selectTxt.length)==';')) )
                            notDealWith = true;

                        //前面是;符号
                        if(text1.substring(text1.length-1,text1.length)==';' &&
                            (selectTxt=='' || (selectTxt!='' && selectTxt.indexOf(';')>-1 && selectTxt.substring(selectTxt.length-1,selectTxt.length)==';') ) ){

                            notDealWith = true;
                        }
                        if(notDealWith==false){
                            var text2DelimiterPos = text2.indexOf(';');
                            if(text2DelimiterPos>-1){
                                var newCurPos = position + text2DelimiterPos + 1;
                                $this.setCurPos(newCurPos,newCurPos);
                            }else{
                                $this.focus();
                            }
                        }
                    }
                }
                that.renderSelectList(that._lastEnterText);
            });
            document.getElementById(that._inputId).onkeydown=function(ev){
                //console.log('onkeydown');
                var $this = $(this);
                var text = this.value;
                var position = $(this).getCurPos();
                //获取0到光标的字符
                var curText = text.substring(0,position);
                var afterText = text.substring(position,text.length);
                var ev=window.event||ev;
                if(ev.keyCode === 8){
                    //console.log('ev.keyCode === 8');
                    //console.log('text=='+text+'/position=='+position);
                    var selectTxt = getSelectText();
                    if(selectTxt!=''){
                        return;
                    }
                    //获取要删除的字符
                    var lastText = curText.substring(curText.length-1,curText.length);
                    //获取要删除后的字符
                    var preText = curText.substring(0,curText.length-1);
                    //判断要删除的字符是否‘;’,是的话，按人员删除，否则按字符pass
                    if(lastText==';'){

                        if(preText.indexOf(';')>-1){//存在‘;’,删除到前个‘;’

                            var preInterval = preText.lastIndexOf(';');
                            $this.setCurPos(preInterval+1,position);

                            //当作人员删除
                            var userArr = preText.split(';');
                            var userIndex = userArr.length-1;
                            //此处删除人员可能存在误差（针对人员重名或自己输入人员名称的情况）
                            if(userArr[userIndex]!=''){
                                var delIndex = null;
                                $.each(that._selectedUser,function (i,item) {
                                    if(item.text == userArr[userIndex]){
                                        delIndex = i;
                                        return false;
                                    }
                                });
                                that._selectedUser.splice(delIndex, 1);
                            }

                        }else{//删除所有

                            $this.setCurPos(0,position);
                            that._selectedUser = [];
                        }
                    }


                }else if(ev.keyCode === 37 && curText.substring(curText.length-1,curText.length)==';'){
                    //当按下左移动按键时，光标停在‘;’后面时，光标按人员组移动
                    //获取下个‘;’
                    var prevDelimiterText = curText.substring(0,curText.length-1);
                    var prevDelimiterPos = prevDelimiterText.lastIndexOf(';')+1;
                    if(prevDelimiterPos>-1){
                        $this.setCurPos(prevDelimiterPos,prevDelimiterPos);
                    }else{
                        $this.setCurPos(0,0);
                    }
                }else if(ev.keyCode === 39 && (curText.substring(curText.length-1,curText.length)==';' || (position==0 && text.indexOf(';')>-1 ) ) ){

                    //当按下右移动按键时，光标停在‘;’后面或停在第一位且存在人员时，光标按人员组移动
                    var nextDelimiterPos = position + afterText.indexOf(';');
                    $this.setCurPos(nextDelimiterPos,nextDelimiterPos);


                }else if(ev.keyCode==46){//禁用delete键
                    return false;
                }else{

                    //console.log('that._isEntering = true');
                    that._isEntering = true;
                }
            }
        }
        //最后匹配选择的人员
        ,confirmUser:function () {
            var that = this;
            var userSelected = [];
            var userText = $('#'+that._inputId).val();
            var newText = '';
            var selectedUser =  $.extend(true, [], that._selectedUser);//复制选择的数组
            var userList =  $.extend(true, [], that._userList);//复制初始的数据
            if(userText!=''){

                var userArr = userText.split(';');
                $.each(userArr,function (i,item) {

                    var isInSelectedUser = false;
                    $.each(selectedUser,function (ci,citem) {
                        if(citem.text==item){
                            isInSelectedUser = true;
                            userSelected.push(citem);
                            newText = newText + citem.text + ';';
                            //删除已选择，避免重名导致ID重复
                            selectedUser.splice(ci, 1);
                            return false;
                        }
                    });
                    //从选择中匹配不上，则从初始数据匹配
                    if(isInSelectedUser==false){

                        $.each(userList,function (ci,citem) {
                            if(citem.text==item){
                                userSelected.push(citem);
                                newText = newText + citem.text + ';';
                                //删除已选择，避免重名导致ID重复
                                selectedUser.splice(ci, 1);
                                return false;
                            }
                        })
                    }
                });
            }
            $('#'+that._inputId).val(newText);
            that._selectedUser = userSelected;
            //console.log(that._selectedUser);
            return userSelected;
        }
        //设置cookies
        ,setCookiesByUsers:function (option) {
            var that = this;
            var cookiesData = getProjectParamCookies(that._cookiesMark,that._cookiesMarkId);
            var userList = null;
            if(!isNullOrBlank(cookiesData)){
                userList = cookiesData.userList;
            }

            if(!isNullOrBlank(userList) && userList.length>0){

                //取未重复的
                $.each(option.userList,function (i,item) {
                    $.each(userList,function (ci,citem) {
                        if(item.id==citem.id){
                            userList.splice(ci,1);
                            return false;
                        }
                    });
                });
                //合并
                var newList = option.userList.concat(userList);
                //取前5个
                userList = [];
                $.each(newList,function (i,item) {
                    if(i<5){
                        userList.push({id:item.id,text:item.text});
                    }else{
                        return false;
                    }
                });
                //Cookies.set(that._cookiesMark, cookiesData);
                var _cookiesData = {
                    id:that._cookiesMarkId,
                    userList:userList,
                    dataAction:'productionUserSelection'
                };
                setProjectParamCookies(that._cookiesMark,_cookiesData,that._cookiesMarkId,10);

            }else{

                if(option.userList!=null && option.userList.length>0){
                    userList = [];
                    $.each(option.userList,function (i,item) {
                        if(i<5){
                            userList.push({id:item.id,text:item.text});
                        }else{
                            return false;
                        }
                    });
                    //Cookies.set(that._cookiesMark, cookiesData);
                    var _cookiesData = {
                        id:that._cookiesMarkId,
                        userList:userList,
                        dataAction:'productionUserSelection'
                    };
                    setProjectParamCookies(that._cookiesMark,_cookiesData,that._cookiesMarkId,10);
                }
            }
        }
        ,inputBlurFun:function ($ele) {
            var that = this;
            $ele.find('input').blur(function(){
                var $this = $(this);
                setTimeout(function () {
                    if(that._isEntering==true || that._lastEnterText!=''){
                        that.confirmUser();
                        that._isEntering = false;
                        that._lastEnterText = '';
                        that._lastEnterPos = null;
                        $this.blur();
                    }
                },200);

            });
        }

    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
