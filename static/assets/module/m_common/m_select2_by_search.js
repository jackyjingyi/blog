/**
 * select2-模糊搜索
 * 基于bootstrap popover样式
 * Created by wrb on 2019/8/9.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_select2_by_search",
        defaults = {
            type:1,//type=1=模糊查询，type=2=一次性请求，再模糊搜索，type=3=可输入可搜索
            option:null,
            isCookies:true,
            changeCallBack:null,
            inputKeyupCallBack:null,
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;
        this._cookiesMark = 'cookiesData_productionUserSelection';
        this._cookiesMarkId = this._currentCompanyUserId;
        if(this.settings.option.params && this.settings.option.params.projectId)
            this._cookiesMarkId = this._cookiesMarkId+'_'+this.settings.option.params.projectId;

        this._dataList = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {

            var that = this;
            if(that.settings.type==1){
                that.initSelect2($(that.element),that.settings.option);
            }else{
                that.getData(function (data) {
                    that.initSelect2($(that.element),that.settings.option);
                })
            }

        }
        //请求数据，一次性查出
        ,getData:function (callBack) {
            var that=this;

            if(that.settings.option.data){
                that._dataList = that.settings.option.data;
                if(callBack)
                    callBack(that.settings.option.data);

            }else{
                var option={};
                option.url=that.settings.option.url;
                option.postData = {};

                if(that.settings.option.params)
                    option.postData = that.settings.option.params;

                m_ajax.postJson(option,function (response) {
                    if(response.code=='0'){

                        var newDataList = [];
                        $.each(response.data,function (i,item) {
                            newDataList.push({id:item.id,text:item.userName});
                        });
                        that._dataList = newDataList;
                        that.settings.option.data = newDataList;
                        if(callBack)
                            callBack(newDataList);

                    }else {
                        S_toastr.error(response.info);

                    }
                });
            }


        }
        //自定义模糊查询
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
        //初始化select2
        ,initSelect2:function ($select,option) {
            var that = this;

            /*if($select.next('.select2-container').length>0){
                $select.select2('destroy').empty();
                $select.next('.select2-container').remove();
            }*/

            var selectOption = {};
            selectOption.placeholder = option.placeholder || {id: '',text: '请输入关键字'};
            selectOption.allowClear = option.isClear && option.isClear==1?true:false;

            selectOption.language = {
                language: "zh-CN",
                maximumSelected:function (e) {
                    return '最多只能选择'+e.maximum+'个人员';
                },
                noResults: function (params) {
                    return "未找到结果";
                }
            };
            selectOption.width = option.width || '100%';
            selectOption.containerCssClass = option.containerCssClass==null?'select-sm':option.containerCssClass;
            selectOption.minimumResultsForSearch = option.minimumResultsForSearch || 0;//最小数量的结果,隐藏搜索框
            selectOption.tags = option.tags || false;
            selectOption.multiple = option.multiple;
            if(option.multiple){
                selectOption.maximumSelectionLength = isNullOrBlank(option.maximumSelectionLength)?0:option.maximumSelectionLength;
                selectOption.closeOnSelect = selectOption.maximumSelectionLength==1?true:false;//选择后下拉框不会关闭
            }
            selectOption.placeholder=option.placeholder;

            //模糊查询请求后台
            if(that.settings.type==1){
                selectOption.ajax = {
                    contentType: "application/json",
                    url: option.url,
                    dataType: 'json',
                    type: 'POST',
                    delay: 500,
                    data: function (params) {
                        var ret = {
                            keyword: params.term,
                            pageSize:10
                        };

                        if(option.params)
                            ret = $.extend({},ret,option.params);

                        return JSON.stringify(ret);
                    },
                    processResults: function (data, params) {
                        that._dataList = data.data;
                        var cookiesData = that.settings.isCookies?that.filterDataNotIn():null;
                        if(option.multiple==true){//多选

                            if(params.term==null || params.term=='' && that.settings.isCookies){//从cookie获取

                                if(cookiesData==null){
                                    return {
                                        results: []
                                    };
                                }else{
                                    return {
                                        results: [{
                                            text: '最近输入',
                                            children : cookiesData
                                        }]
                                    };
                                }
                            }else if(data.data==null || data.data.length==0){
                                return {
                                    results: []
                                };
                            }else{
                                return {
                                    results: [{
                                        text: '可能找的人',
                                        children :
                                            $.map(data.data, function (o, i) {
                                                return {
                                                    id: o.id,
                                                    text: o.userName
                                                }
                                            })

                                    }]
                                };
                            }

                        }else{

                            if((params.term==null || params.term=='') && cookiesData!=null && cookiesData.length>0 && that.settings.isCookies){//从cookie获取
                                return {
                                    results: [{
                                        text: '最近输入',
                                        children : cookiesData
                                    }]
                                };
                            }else if(data.data==null || data.data.length==0){
                                return {
                                    results: []
                                };
                            }else{
                                return {
                                    results: [{
                                        text: '可能找的人',
                                        children :
                                            $.map(data.data, function (o, i) {
                                                return {
                                                    id: o.id,
                                                    text: o.userName
                                                }
                                            })

                                    }]
                                };
                            }
                        }
                    },
                    cache: false
                };
            }

            //模糊查询不请求台
            if(that.settings.type==2){

                selectOption.data = that._dataList;
                selectOption.query = function (query) {
                    var newList = [], datas = {results: []};

                    if(!isNullOrBlank(query.term)){//存在关键字
                        $.each(option.data,function (i,item) {
                            var newItem = that.matchCustom(query,item);
                            if(!isNullOrBlank(newItem))
                                newList.push(newItem);
                        });
                        if(newList==null || newList.length==0){
                            datas = {results: []};
                        }else{
                            datas = that.resultsText(option,newList);
                        }
                    }else{
                        var cookiesData = that.settings.isCookies?that.filterDataNotIn():null;
                        if((that.settings.isCookies && cookiesData==null) || option.data==null || option.data.length==0){

                            datas = {results: []};

                        }else if(!that.settings.isCookies && option.data){

                            datas = that.resultsText(option,option.data);

                        }else if(that.settings.isCookies && cookiesData){
                            datas = {
                                results: [{
                                    text: '最近输入',
                                    children : cookiesData
                                }]
                            };
                        }
                    }

                    query.callback(datas);//回调query函数;
                }
            }

            if(that.settings.type==3){

                selectOption.data = that._dataList;
                selectOption.query = function (query) {
                    var datas = that.matchQuery(option,query);
                    query.callback(datas);//回调query函数;
                }
            }

            var $userSelect = $select.select2(selectOption);

            $select.find('option').each(function (i) {
                var text = $.trim($(this).text());
                $(this).attr('data-text',text);
            });


            $select.on("change", function (e) {

                var data = $(this).val();
                if(that.settings.changeCallBack)
                    that.settings.changeCallBack(data);

            });

            /*$userSelect.on('select2:open select2:opening select2:closing', function (e) {
                //禁掉文本输入
                var $searchField = $(this).parent().find('.select2-search__field');
                $searchField.prop('disabled', true);
                $searchField.css('display', 'none');

                var $input = $('<span class="select2-search select2-search--dropdown"><input class="select2-search__field" type="search" tabindex="0" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" role="textbox"></span>')
                var $selectDrop = $('.select2-dropdown.select2-dropdown--below').eq(0);
                $selectDrop.eq(0).prepend($input);
                $selectDrop.find('input.select2-search__field').on('keyup',function () {
                    $searchField.val($(this).val());
                    $searchField.keyup();
                });
            });*/


            //加载中事件
            if(that.settings.type==3 && option.tags==false){

                $select.next('.select2-container').find('.select2-selection__rendered').hide();
                var styleStr =  'width: 100%; height: 28px; border: none; outline: none;padding: 0 5px; ';
                if($select.next('.select2-container').find('.select2-selection.select-sm').length==0){
                    styleStr =  'width: 100%; height: 30px; border: none; outline: none;padding: 0 5px; ';
                }
                var $iHtml = $('<span class="new-input"><input type="text" name="'+option.key+'" placeholder="'+option.placeholder+'" autocomplete="off" style="'+styleStr+'"></span>');
                $iHtml.find('input').on('keyup',function () {
                    var text = $.trim($(this).val());
                    $('.select2-search--dropdown .select2-search__field').val(text).keyup();
                    $userSelect.select2('open');
                    $userSelect.val('').trigger('change');
                    if(that.settings.inputKeyupCallBack)
                        that.settings.inputKeyupCallBack(text);

                });
                $select.next('.select2-container').find('.select2-selection__rendered').after($iHtml);
                $userSelect.on('select2:open select2:opening', function (e) {
                    $('.select2-search--dropdown').hide();
                });
                $userSelect.on('select2:select', function (e) {
                    var data = e.params.data;
                    $select.next().find('.new-input input').val(data.text);
                });
            }



            if(option.multiple && option.maximumSelectionLength==1){
                $userSelect.on('select2:select select2:close select2:open select2:opening change', function (e) {
                    var $this = $(this);
                    var t = setTimeout(function () {
                        var $ul = $this.parent().find('ul.select2-selection__rendered');
                        $ul.find('li:first span.select2-selection__choice__remove').remove();
                        clearTimeout(t);
                    },10);
                });
            }

            if(that.settings.type==1 && option.value && typeof option.value == 'string'){

                $userSelect.val(option.value).trigger('change');

            }else if(that.settings.type==1 && typeof option.value == 'object' && option.value && option.value.length>0){

                $.each(option.value,function (i,item) {
                    var $iHtml = $('<option selected >' + item.text + '</option>').val(item.id);
                    $userSelect.append($iHtml).trigger('change');
                });

            }else if(that.settings.type==2 && typeof option.value == 'object' && option.value && option.value.length>0){

                var selectedIds = [];
                $.each(option.value,function (i,item) {
                    selectedIds.push(item.id);
                });
                $userSelect.val(selectedIds).trigger('change');


            }else if(that.settings.type==3){

                if(option.value && typeof option.value === 'string'){

                    var $input = $select.next('.select2-container').find('input[name="' + option.key + '"]');
                    if($input.length>0){
                        $input.val(option.value);
                        $userSelect.val('').trigger('change');
                    }else{
                        $userSelect.val(option.value).trigger('change');
                    }

                }else if(option.value && typeof option.value === 'object'){

                    var selectedIds = [];
                    $.each(option.value,function (i,item) {
                        if(isNullOrBlank(item.id)){
                            /*var $iHtml = $('<option selected >' + item.text + '</option>').val(item.text);
                            $userSelect.append($iHtml);*/
                            selectedIds.push(item.text);
                        }else{
                            selectedIds.push(item.id);

                        }
                    });
                    $userSelect.val(selectedIds).trigger('change');

                }else{
                    $userSelect.val('').trigger('change');
                }

            }else{

            }

            if(that.settings.renderCallBack)
                that.settings.renderCallBack();

        }
        //设置cookies
        ,setSelect2CookiesByUsers:function (option) {
            var that = this;
            var cookiesData = getProjectParamCookies(that._cookiesMark,that._cookiesMarkId);
            var userList = null;
            if(!isNullOrBlank(cookiesData)){
                userList = cookiesData.userList;
            }
            if(!isNullOrBlank(userList) && userList.length>0){

                //取未重复的
                $.each(option.userList,function (i,item) {
                    if(isNullOrBlank(item.text))
                        item.text = item.userName;
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
                //Cookies.set(that._cookiesMark, userList);
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
                        if(isNullOrBlank(item.userName))
                            item.userName = item.text;
                        if(i<5){
                            userList.push({id:item.id,text:item.userName});
                        }else{
                            return false;
                        }
                    });
                    //Cookies.set(that._cookiesMark, userList);
                    var _cookiesData = {
                        id:that._cookiesMarkId,
                        userList:userList,
                        dataAction:'productionUserSelection'
                    };
                    setProjectParamCookies(that._cookiesMark,_cookiesData,that._cookiesMarkId,10);
                }
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

                if(that._dataList && that._dataList.length>0){
                    $.each(userList,function (i,item) {
                        var isExist = false;
                        $.each(that._dataList,function (ci,citem) {
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
        //是否加resultsText
        ,resultsText:function (option,list) {
            var datas = {};
            if(option.isResultsText==0){
                datas = {
                    results: list
                }
            }else{
                datas = {
                    results: [{
                        text: option.resultsText || '可能找的人',
                        children :list
                    }]
                }
            }
            return datas;
        }
        ,matchQuery:function (option,query) {
            var that = this;
            var newList = [], datas = {results: []};
            if(!isNullOrBlank(query.term)){//存在关键字
                $.each(option.data,function (i,item) {
                    var newItem = that.matchCustom(query,item);
                    if(!isNullOrBlank(newItem))
                        newList.push(newItem);
                });

                if(option.tags)
                    newList.push({id:query.term,text:query.term});

                if(newList==null || newList.length==0){
                    datas = {results: []};
                }else{
                    datas = {
                        results: newList
                    }
                }
            }else{
                datas = {results: option.data};
            }

            return datas;
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


