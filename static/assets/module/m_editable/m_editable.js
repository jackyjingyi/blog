/**
 *
 * Created by wrb on 2018/9/13.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_editable",
        defaults = {
            type:'1'//type=1=input
            ,inline:false
            ,placement:'bottom'
            ,popoverClass:null
            ,popoverStyle:null
            ,ok:null//提交方法
            ,cancel:null//关闭方法
            ,closed:null//
            ,completed:null//渲染完成
            ,noInternalInit:false//true，由外面调用初始化
            ,hideElement:false//是否隐藏元素
            ,contentClass:null//内容外层样式
            ,content:null//内容
            ,btnRight:false//多行按钮是否在右侧
            ,isNotSet:true//是否展示未设置
            ,editableControlStyle:null//m-editable-control附件样式
            ,controlClass:'input-sm'//控件样式
            ,inputGroupClass:null//控件样式
            ,limitStartTime:false
            ,value:null
            ,dataInfo:null
            ,postParam:null
            ,m_partyA_selectCallBack:null//工商公司选择回调
            ,m_partyA_inputChangeCallBack:null//m_partyA文本change事件
            ,targetNotQuickCloseArr:null//点击目标元素不关闭浮窗([class名1,class名2...])
            ,isInitAndStart:false//是否初始后就启动编辑状态
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;



        this._dialogType = 2;
        if(this.settings.inline)
            this._dialogType = 3;

        //获取element属性
        this._valid = $(this.element).attr('data-valid');//验证方式
        this._type = $(this.element).attr('data-type');//类型:1=input,2=textarea,3=checkbox,4=address,5=select,6=input+select,7=甲方
        this._key = $(this.element).attr('data-key');
        this._unit = $(this.element).attr('data-unit');
        this._placeholder = $(this.element).attr('data-placeholder');
        if(this._placeholder==undefined && this._type!='5')
            this._placeholder = '请输入';

        this._targetEle = $(this.element).attr('data-target-ele');//目标元素渲染
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        , render: function () {
            var that = this;

            //判断值是否object类型，且对象值不为空
            var isNullObjectValue = true;
            if(typeof that.settings.value === 'object' && $.isPlainObject(that.settings.value)){
                $.each(that.settings.value,function (key,value) {
                    if(!isNullOrBlank(value)){
                        isNullObjectValue = false;
                        return false;
                    }
                })
            }

            if((isNullOrBlank(that.settings.value) || (typeof that.settings.value === 'object' && $.isPlainObject(that.settings.value) && isNullObjectValue)) && that.settings.isNotSet === true)
                $(that.element).html('<span class="fc-v1-grey">未设置</span>');

            //浮窗，添加padding
            var contentClass = that.settings.contentClass;
            if(contentClass==null && that.settings.inline===false)
                contentClass = 'p-m';

            var isShowOkBtn = false,isShowCancelBtn = false;
            if(typeof (that.settings.ok) == 'function')
                isShowOkBtn = true;
            if(typeof (that.settings.cancel) == 'function')
                isShowCancelBtn = true;

            var content = that.renderEditTypeHtml();
            var iHtml = template('m_editable/m_editable',{
                content:that.settings.content||content,
                title:that.settings.title,
                contentClass:contentClass,
                editableControlStyle:that.settings.editableControlStyle,
                btnRight:that.settings.btnRight,
                isShowCancelBtn:isShowCancelBtn,
                isShowOkBtn:isShowOkBtn
            });

            $(that.element).off('click').on('click',function (e) {

                var options = {};
                options.content=iHtml;
                options.placement=that.settings.placement;
                options.type=that._dialogType;
                options.scrollClose=false;
                options.hideElement = that.settings.hideElement;
                options.popoverClass = that.settings.inline?'editable-inline':null;
                options.targetNotQuickCloseArr = that.settings.targetNotQuickCloseArr;

                if(that.settings.popoverClass){

                    if(options.popoverClass==null)
                        options.popoverClass = '';

                    options.popoverClass = options.popoverClass + ' ' + that.settings.popoverClass;
                }

                options.popoverStyle = that.settings.popoverStyle?that.settings.popoverStyle:(that.settings.inline?{'position': 'relative','top': '0px','left': '0px'}:null);

                if(that.settings.inline===false)
                    options.isArrow = true;

                if(that._type==11){
                    options.isQuickCloseStopPropagation = false;
                    options.targetNotQuickCloseArr=['note-editor','modal-backdrop','note-popover'];
                }


                options.closed=function ($popover) {

                    //简单处理富文本选中文字关闭浮窗问题
                    var $nodeEditor = $popover.find('.note-editor .note-editable');
                    if($nodeEditor.length>0){//富文本

                        var txt = window.getSelection?window.getSelection():document.selection.createRange().text.toString();
                        if(txt!='' && $nodeEditor.text().indexOf(txt)){
                            return false;
                        }
                    }

                    if(that.settings.closed)
                        return that.save($popover);

                };
                options.renderedCallBack=function ($popover) {

                    that.renderingCompleted($popover);
                    var $text = $popover.find('input[type="text"]');
                    if($text.length>0){
                        var val = $text.eq(0).val();
                        $text.eq(0).val('').focus().val(val);
                    }
                };

                if(isNullOrBlank(that._targetEle)){
                    $(that.element).m_floating_popover(options,true);
                }else{
                    $(that._targetEle).m_floating_popover(options,true);
                }

                e.stopPropagation();
                return false;
            });

            if(that.settings.isInitAndStart)
                $(that.element).click();

        }
        //文本清空
        ,inputClear:function ($popover) {
            var that = this;
            $popover.find('.m-editable-clear').prev().off('focus keyup').on('focus keyup',function () {
                if($.trim($(this).val())!=''){
                    $(this).next().show();
                }else{
                    $(this).next().hide();
                }
            });
            $popover.find('.m-editable-clear').each(function () {
                if($.trim($(this).prev().val())==''){
                    $(this).hide();
                }else{
                    $(this).show();
                }
            });

            $popover.find('span.m-editable-clear').off('click').on('click',function () {
                $(this).prev().val('');
                $(this).hide();
            });
        }
        ,renderEditTypeHtml:function () {
            var that = this,html = '';
            switch (that._type){
                case '1'://文本
                    html = template('m_editable/m_editable_input',{controlClass:that.settings.controlClass,inputGroupClass:that.settings.inputGroupClass,placeholder:that._placeholder,value:that.settings.value,key:that._key,unit:that._unit});
                    break;
                case '2'://textarea
                    html = template('m_editable/m_editable_textarea',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,key:that._key});
                    break;
                case '3'://checkbox
                    html = template('m_editable/m_editable_checkbox',{controlClass:that.settings.controlClass,placeholder:that._placeholder,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '4'://address
                    html = template('m_editable/m_editable_address',{controlClass:that.settings.controlClass,placeholder:that._placeholder,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '5'://select
                    html = template('m_editable/m_editable_select',{controlClass:that.settings.controlClass,placeholder:that._placeholder,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '6'://input+select
                    html = template('m_editable/m_editable_select1',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '7'://甲方
                    html = template('m_editable/m_editable_partyA',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '8'://比例金额
                    html = template('m_editable/m_editable_fee_calculation',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '9'://付款，收款
                    html = template('m_editable/m_editable_payment',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '10'://time
                    html = template('m_editable/m_editable_time',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '11'://富文本
                    html = template('m_editable/m_editable_rtf',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '12'://select2-可多选模糊搜索
                    html = template('m_editable/m_editable_select2',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '13'://select2-单选模糊搜索,可输入
                    html = template('m_editable/m_editable_select2',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '14'://项目已收款
                    html = template('m_editable/m_editable_dean_fee',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                case '15'://任务比例
                    html = template('m_editable/m_editable_proportion',{controlClass:that.settings.controlClass,placeholder:that._placeholder,value:that.settings.value,dataInfo:that.settings.dataInfo,key:that._key});
                    break;
                default :
                    html = '';
                    break;
            }
            return html;
        }
        ,renderingCompleted:function ($popover) {
            var that = this;
            switch (that._type){
                case '1':
                case '2':
                    that.inputClear($popover);
                    break;
                case '4':
                    var province = undefined,city = undefined,county = undefined;
                    if(that.settings.dataInfo!=null && !isNullOrBlank(that.settings.dataInfo.province))
                        province = that.settings.dataInfo.province;

                    if(that.settings.dataInfo!=null && !isNullOrBlank(that.settings.dataInfo.city))
                        city = that.settings.dataInfo.city;

                    if(that.settings.dataInfo!=null && !isNullOrBlank(that.settings.dataInfo.county))
                        county = that.settings.dataInfo.county;

                    $popover.find('#selectRegion').citySelect({
                        prov:province,
                        city:city,
                        dist:county,
                        nodata:'none',
                        required:false
                    });
                    break;

                case '5':
                    if(!that.settings.noInternalInit){

                        var multiple = $(that.element).attr('data-multiple');
                        var width = $(that.element).attr('data-width');
                        var containerCssClass = $(that.element).attr('data-container-class');

                        $popover.find('select').select2({
                            tags:false,
                            allowClear: false,
                            minimumResultsForSearch: -1,
                            multiple:multiple && multiple==1?true:false,
                            width:isNullOrBlank(width)?'100%':width,
                            placeholder:that._placeholder,
                            language: "zh-CN",
                            containerCssClass:isNullOrBlank(containerCssClass)?null:containerCssClass
                        });
                        $popover.find('select').val(that.settings.value).trigger('change');
                    }
                    break;
                case '6':
                    that.inputClear($popover);
                    $popover.find('button[data-toggle]').off('click').on('click',function () {
                        $popover.find('ul.dropdown-menu').toggle();
                    });
                    $popover.find('ul>li>a').off('click').on('click',function () {
                        var name = $(this).text();
                        $popover.find('input').val(name);
                        $popover.find('ul.dropdown-menu').toggle();
                        return false;
                    });
                    break;
                case '7':
                    that.inputClear($popover);
                    $popover.find('input#'+that._key).m_partyA({
                        eleId:that._key,
                        clearOnInit:false,
                        targetNotQuickCloseArr:that.settings.targetNotQuickCloseArr,
                        selectCallBack:function (data) {
                            if(that.settings.m_partyA_selectCallBack)
                                that.settings.m_partyA_selectCallBack(data);
                        },
                        inputChangeCallBack:function (txt) {
                            if(that.settings.m_partyA_inputChangeCallBack)
                                that.settings.m_partyA_inputChangeCallBack(txt);
                        }
                    });

                    break;
                case '8':
                    that.inputClear($popover);
                    $popover.find('input[data-action="feeCalculation"]').keyup(function () {

                        var name = $(this).attr('name');
                        var val = $(this).val();
                        var total = $(that.element).attr('data-total-cost');
                        if(name=='feeProportion'){//比例
                            var fee = (val-0)*(total-0)/100;
                            fee = decimal(fee,7);
                            fee = parseFloat(decimal(fee,6));
                            $popover.find('input[name="fee"]').val(fee);
                        }
                        if(name=='fee'){//金额
                            var proportion = (val-0)/(total-0)*100;
                            proportion = decimal(proportion,3);
                            proportion = decimal(proportion,2);
                            $popover.find('input[name="feeProportion"]').val(proportion);
                        }

                    });
                    break;
                case '9':

                    var dateStr = getNowDate();
                    $popover.find('input[name="paidDate"]:first').val(dateStr);
                    that.inputClear($popover);
                    break;

                case '10':

                    var isInitShow = $(that.element).attr('data-init-show');//是否初始化就展示选择日期浮窗
                    var isOnpickedSave = $(that.element).attr('data-onpicked-save');//是否选择就保存
                    $popover.find('input[name="'+that._key+'"]').off('click').on('click',function () {

                        var maxDate = $(that.element).attr('data-max-date');//限制的最大时间
                        var minDate = $(that.element).attr('data-min-date');//限制的最小时间
                        if(that.settings.limitStartTime){
                            minDate = ($(that.element).attr('data-min-date') == undefined ||$(that.element).attr('data-min-date')=='')? '2021-01-01' : $(that.element).attr('data-min-date');
                        }
                        var isShowClear = $(that.element).attr('data-show-clear');//是否屏蔽清空按钮
                            isShowClear = isShowClear==0?false:true;

                        var onpicked =function(dp){

                            if(isOnpickedSave=='1'){
                                var data = {};
                                data[that._key] = dp.cal.getNewDateStr();
                                if(that.settings.closed){
                                    //that.settings.closed(data);
                                    $(that.element).m_floating_popover('closePopover');
                                    return false;
                                }


                                if(that.settings.ok){
                                    that.settings.ok(data);
                                    $(that.element).m_floating_popover('closePopover');
                                }
                            }
                        };
                        WdatePicker({el:this,maxDate:maxDate,minDate:minDate,onpicked:onpicked,isShowClear:isShowClear});
                    });
                    if(isInitShow=='1')
                        $popover.find('input[name="'+that._key+'"]').click();

                    break;
                case '11':
                    var isVideo = $(that.element).attr('data-is-video');
                    var isPicture = $(that.element).attr('data-is-picture');
                    $popover.css('z-index','inherit');
                    $popover.find('#remarkEditor').m_text_editor({
                        isVideo:isNullOrBlank(isVideo)?false:true,
                        isPicture:isNullOrBlank(isPicture)?false:true,
                        placeholder:that._placeholder,
                        onInit:function () {
                            $popover.find('#remarkEditor .summernote').summernote('code', that.settings.value);
                        }
                    },true);
                    break;

                case '12':

                    var type = $(that.element).attr('data-do-type');
                    var isCookies = $(that.element).attr('data-cookies');
                    var multiple = $(that.element).attr('data-multiple');
                    var maximumSelectionLength = $(that.element).attr('data-maximum-selection');
                    var isClear = $(that.element).attr('data-is-clear');
                    var dataUrlType = $(that.element).attr('data-url-type');
                    var url = restApi.url_getUserByKeyWord;
                    if(dataUrlType != undefined && dataUrlType=='1'){
                        url = restApi.url_getProjectPartMember;
                    }else if(dataUrlType != undefined && dataUrlType=='2'){
                        url = restApi.url_listUserByMajor;
                    }else if(dataUrlType != undefined && dataUrlType=='3'){
                        url = restApi.url_lightProject_listLightProjectPartMember;
                    }else if(dataUrlType != undefined && dataUrlType=='4'){
                        url = restApi.url_listProjectDean;
                    }else if(dataUrlType != undefined && dataUrlType=='5'){
                        url = restApi.url_listUserNoLeader;
                    }

                    $popover.find('select').m_select2_by_search({
                        type:type||2,
                        isCookies:isCookies==0?false:true,
                        option:{
                            multiple:multiple==0?false:true,
                            maximumSelectionLength:maximumSelectionLength,
                            isClear:isClear,
                            url:url,
                            data:that.settings.dataInfo || null,
                            params:that.settings.postParam,
                            value:that.settings.value
                        }},true);

                    break;
                case '13':
                    var multiple = $(that.element).attr('data-multiple');
                    var tags = $(that.element).attr('data-tags');
                    var containerCssClass = $(that.element).attr('data-container-class');
                    var minimumResultsForSearch = $(that.element).attr('data-minimum-results');//data-multiple="1" data-minimum-results="-1"
                    $popover.find('select').m_select2_by_search({
                        type:3,
                        isCookies:false,
                        option:{
                            multiple:multiple && multiple==1?true:false,
                            minimumResultsForSearch:minimumResultsForSearch,
                            tags:tags && tags==1?true:false,
                            data:that.settings.dataInfo || [],
                            placeholder:that._placeholder,
                            containerCssClass:isNullOrBlank(containerCssClass)?'':containerCssClass,
                            width:'100%',
                            key:'new_'+that._key,
                            value:that.settings.value
                        },
                        renderCallBack:function () {



                        }
                    },true);


                    /*$popover.find('select').select2({
                        tags:true,
                        allowClear: true,
                        multiple:true,
                        minimumResultsForSearch: -1,
                        containerCssClass:'select-sm',
                        language: "zh-CN",
                        width:'100%',
                        placeholder : '请选择',
                        data:[{id:1,text:'建筑'},{id:2,text:'建筑1'},{id:3,text:'建筑2'}]
                    });*/

                    break;
                case '14':
                case '15':
                    that.inputClear($popover);
                    break;
            }

            if(that.settings.placement=='bottom' && !isNullOrBlank(that.settings.title))
                $popover.find('.arrow').addClass('has-title');

            that.bindActionClick($popover);
            that.save_validate($popover);
            if(that.settings.completed)
                that.settings.completed($popover);
        }
        ,bindActionClick:function ($popover) {
            var that = this;
            $popover.find('button.m-editable-submit').off('click').on('click',function () {
                that.save($popover);
            });
            $popover.find('button.m-editable-cancel').off('click').on('click',function () {
                $(that.element).m_floating_popover('closePopover');
            });
        }
        //匹配返回obj
        ,matchDataReturnObj:function (list,name) {
            var that = this;
            var obj = null;
            $.each(list,function (i,item) {
                if(name==item.text){
                    obj = item;
                    return false;
                }
            });
            return obj;
        }
        ,save:function ($popover) {
            var that = this;
            if($popover==undefined)
                 return true;

            var isContinue = true;

            var callBackFun = function (isContinue,data) {
                if(isContinue && that.settings.closed)
                    that.settings.closed(data,$popover);

                if(!isContinue && that.settings.closed)
                    that.settings.closed(false,$popover);

                if(isContinue && that.settings.ok){
                    that.settings.ok(data);
                    if($('.m-floating-popover').length>0)
                        $(that.element).m_floating_popover('closePopover');
                }
                if(!isContinue && that.settings.ok){
                    that.settings.ok(false);
                    if($('.m-floating-popover').length>0)
                        $(that.element).m_floating_popover('closePopover');
                }
            };


            if(that._type==11){//富文本

                var data = {};
                data[that._key] = $popover.find('#remarkEditor .summernote').summernote('code');

                //字符串
                if(typeof that.settings.value === 'string' && that.settings.value == data[that._key]){
                    isContinue = false;
                }
                //存在key,判断原来是空，现在也是空
                if(!isNullOrBlank(that._key) && isNullOrBlank(data[that._key]) && isNullOrBlank(that.settings.value)){
                    isContinue = false;
                }

                callBackFun(isContinue,data);

            }else if(that._type==13 && $popover.find('input[name="new_' + that._key + '"]').length>0){

                if(that.saveValid($popover)) {
                    var data = {};
                    //var $newInput = $popover.find('input[name="new_' + that._key + '"]');
                    data[that._key] = $.trim($popover.find('input[name="new_' + that._key + '"]').val());
                    var dataItem = that.matchDataReturnObj(that.settings.dataInfo,data[that._key]);
                    if (!isNullOrBlank(dataItem))
                        data[that._key + 'Id'] = dataItem.id;

                    //存在key,判断原来是空，现在也是空
                    if (!isNullOrBlank(that._key) && isNullOrBlank(data[that._key]) && isNullOrBlank(that.settings.value)) {
                        isContinue = false;
                    }
                    //字符串
                    if(typeof that.settings.value === 'string' && that.settings.value == data[that._key]){
                        isContinue = false;
                    }
                    callBackFun(isContinue, data);
                }else{
                    return false;
                }

            }else if(that._type==15 && $popover.find('input[name="' + that._key + '"]').length>0){

                if(that.saveValid($popover)) {
                    var data = {};
                    //var $newInput = $popover.find('input[name="new_' + that._key + '"]');
                    data[that._key] = $.trim($popover.find('input[name="' + that._key + '"]').val());

                    //存在key,判断原来是空，现在也是空
                    if (!isNullOrBlank(that._key) && isNullOrBlank(data[that._key]) && isNullOrBlank(that.settings.value)) {
                        isContinue = false;
                    }
                    //字符串
                    if(typeof that.settings.value === 'string' && that.settings.value == data[that._key]){
                        isContinue = false;
                    }
                    callBackFun(isContinue, data);
                }else{
                    return false;
                }

            }else{
                if(that.saveValid($popover)){

                    var data = $popover.find('form').serializeObject();

                    if(that._type==12 || that._type==13){//select2-模糊搜索
                        data[that._key] = [];
                        var selectData= $popover.find('select').eq(0).select2('data');
                        if(selectData && selectData.length>0){
                            $.each(selectData,function (i,item) {
                                data[that._key].push({id:item.id,text:item.text});
                            });
                        }
                    }

                    if(that._type==6){
                        var $dataA = $popover.find('.dropdown-menu a[data-name="'+data[that._key]+'"]');
                        if($dataA.length>0)
                            data[that._key+'Id'] = $dataA.attr('data-id');
                    }

                    //数组
                    if(typeof that.settings.value === 'object' && $.isArray(that.settings.value) && data[that._key]){
                        //$(that.element).m_floating_popover('closePopover');
                        var keyValue = data[that._key];
                        if(typeof data[that._key] === 'string')
                            keyValue = data[that._key].split(',');

                        //console.log(that.settings.value.sort().toString())
                        //console.log(keyValue.sort().toString())
                        //console.log(JSON.stringify(that.settings.value.sort()))
                        //console.log(JSON.stringify(keyValue.sort()))
                        //if(that.settings.value.sort().toString() == keyValue.sort().toString())
                        if(JSON.stringify(that.settings.value.sort()) == JSON.stringify(keyValue.sort()))
                            isContinue = false;
                    }
                    //json
                    if(typeof that.settings.value === 'object' && $.isPlainObject(that.settings.value)){
                        //&& JSON.stringify(that.settings.value) == JSON.stringify(data)
                        var valueArr = [],newValueArr = [];
                        $.each(that.settings.value,function (key,value) {
                            if(!isNullOrBlank(value)){
                                valueArr.push(key);
                                valueArr.push(value);
                            }
                        });
                        $.each(data,function (key,value) {
                            if(!isNullOrBlank(value)){
                                newValueArr.push(key);
                                newValueArr.push(value);
                            }
                        });
                        if(valueArr.sort().toString() == newValueArr.sort().toString()){
                            //$(that.element).m_floating_popover('closePopover');
                            isContinue = false;
                        }
                    }
                    //字符串
                    if(typeof that.settings.value === 'string' && that.settings.value == data[that._key]){
                        //$(that.element).m_floating_popover('closePopover');
                        isContinue = false;
                    }
                    //存在key,判断原来是空，现在也是空
                    if(!isNullOrBlank(that._key) && isNullOrBlank(data[that._key]) && isNullOrBlank(that.settings.value)){
                        isContinue = false;
                    }

                    callBackFun(isContinue,data);

                }else{
                    return false;
                }
            }

        }
        //验证
        ,saveValid:function ($popover) {
            var that = this;
            if($popover==undefined || $popover.find('form').length==0)
                return true;
            if ($popover.find('form').valid()) {
                return true;
            } else {
                return false;
            }
        }
        ,save_validate:function($popover){
            var that = this;
            var options = {};
            var t = that._valid;
            if(isNullOrBlank(t))
                return false;
            options.rules = {};
            options.messages = {};


            var validTitle = $(that.element).attr('data-valid-title');
            if(validTitle==undefined||validTitle=='')
                validTitle = '金额';

            var maxLimit = $(that.element).attr('data-limit-max')-0;
            var minLimit = $(that.element).attr('data-limit-min')-0;

            var maxLength = $(that.element).attr('data-max-length');
            var minLength = $(that.element).attr('data-min-length');


            var isMaxLimit = true;
            var isMinLimit = true;
            if(maxLimit==NaN)
                isMaxLimit = false;

            if(minLimit==NaN)
                isMinLimit = false;


            switch (t){
                case '1':

                    var newKey = that._key;
                    if(that._type==13){
                        newKey = 'new_'+that._key;
                    }

                    options.rules[newKey]={required: true};
                    options.messages[newKey]={required: that._placeholder};

                    if(isNullOrBlank(maxLength)){
                        options.rules[newKey].maxlength = maxLength;
                        options.messages[newKey].maxlength = '请控制在'+maxLength+'字符内';
                    }

                    break;

                case '2'://合同总金额的单位为“元”'
                    options.rules[that._key]={
                        required: true,
                        number:true,
                        over20:true,//整数部分是否超过20位
                        minLimit:isMinLimit,
                        point2:true
                    };
                    options.messages[that._key]={
                        required: that._placeholder,
                        number:'请输入有效数字',
                        over20:'对不起，您的操作超出了系统允许的范围',
                        minLimit:'金额不能小于'+minLimit,
                        point2:'请保留小数点后两位!'
                    };
                    break;
                case '3':
                    options.rules[that._key]={
                        required: true,
                        maxlength:maxLength==undefined?250:maxLength-0
                    };
                    options.messages[that._key]={
                        required: that._placeholder,
                        maxlength: '请控制'+(maxLength==undefined?250:maxLength-0)+'字符内'
                    };
                    break;
                case '4'://收支管理-金额比例

                    options.rules.feeProportion = {
                        required:true,
                        number:true,
                        limitProportion:true,
                        point2:true
                    };
                    options.rules.fee = {
                        required:true,
                        number:true,
                        minNumber:true,
                        point2:true,//验证数字
                        over20:true,//整数部分是否超过10位
                        minLimit:isMinLimit,//
                        maxLimit:isMaxLimit
                    };
                    options.messages.feeProportion = {
                        required:'请输入比例',
                        number:'请输入有效数字',
                        limitProportion:'请输入0到100之间的数字',
                        point2:'请保留小数点后两位'
                    };
                    options.messages.fee = {
                        required:'金额不能为空',
                        number:'请输入有效数字',
                        minNumber:'请输入大于0的数字',
                        point2:'请保留小数点后两位',
                        over20:'对不起，您的操作超出了系统允许的范围',
                        minLimit:'金额不能小于'+minLimit,
                        maxLimit:'金额不能大于'+maxLimit
                    };
                    break;

                case '5'://收支管理-收付款金额（万元）

                    options.rules[that._key] = {
                        required:true,
                        number:true,
                        point6:true,//验证数字
                        over20:true,//整数部分是否超过20位
                        minLimit:isMinLimit,
                        maxLimit:isMaxLimit
                    };
                    options.messages[that._key] = {
                        required:'金额不能为空',
                        number:'请输入有效数字',
                        over20:'对不起，您的操作超出了系统允许的范围',
                        point6:'请保留小数点后六位',
                        minLimit:'金额不能小于'+minLimit,
                        maxLimit:'金额不能大于'+maxLimit
                    };
                    break;
                case '6'://金额(元)或其他
                    options.rules[that._key] = {
                        required:true,
                        number:true,
                        point2:true,//验证数字
                        over20:true,//整数部分是否超过20位
                        minLimit:isMinLimit,
                        maxLimit:isMaxLimit
                    };
                    options.messages[that._key] = {
                        required:validTitle+'不能为空',
                        number:'请输入有效数字',
                        over20:'对不起，您的操作超出了系统允许的范围',
                        point2:'请保留小数点后两位',
                        minLimit:validTitle+'不能小于'+minLimit,
                        maxLimit:validTitle+'不能大于'+maxLimit
                    };
                    break;
                case '7'://百分比（4位小数点）
                    options.rules[that._key] = {
                        required:true,
                        number:true,
                        point4:true,
                        over20:true,//整数部分是否超过20位
                        minLimit:isMinLimit,
                        maxLimit:isMaxLimit
                    };
                    options.messages[that._key] = {
                        required:validTitle+'不能为空',
                        number:'请输入有效数字',
                        point4:'请保留小数点后四位',
                        over20:'对不起，您的操作超出了系统允许的范围',
                        minLimit:validTitle+'不能小于'+minLimit,
                        maxLimit:validTitle+'不能大于'+maxLimit
                    };
                    break;
                case '8':
                    options.rules[that._key]={
                        maxlength:maxLength==undefined?250:maxLength-0
                    };
                    options.messages[that._key]={
                        maxlength: '请控制'+(maxLength==undefined?250:maxLength-0)+'字符内'
                    };
                    break;
                default :

                    break;
            }
            options.errorPlacement=function (error, element) { //指定错误信息位置
                if(element.parents('.input-out-box').length>0){
                    error.appendTo(element.closest('.input-out-box'));
                }else{
                    error.appendTo(element.closest('.m-editable-content'));
                }

            };
            $popover.find('form').validate(options);

            $.validator.addMethod('over20', function (value, element) {
                value = $.trim(value);
                var isOk = true;
                if(parseInt(value).toString().length>20)
                    isOk=false;
                return isOk;
            }, '对不起，您的操作超出了系统允许的范围');

            $.validator.addMethod('minNumber', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if( value<=0){
                    isOk = false;
                }
                return  isOk;
            }, '请输入大于0的数字');

            $.validator.addMethod('point6', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.numberWithPoints_6.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后六位');

            $.validator.addMethod('limitProportion', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if( value<=0 || value>100){
                    isOk = false;
                }
                return  isOk;
            }, '请输入0到100之间的数字');

            $.validator.addMethod('point2', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.numberWithPoints_2.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后两位');

            $.validator.addMethod('point3', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.numberWithPoints_3.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后三位');

            $.validator.addMethod('point4', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.numberWithPoints_4.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后四位');

            $.validator.addMethod('percentage3', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.numberWithPercentagePoints_3.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请按x.xxx%百分比格式输入');

            $.validator.addMethod('maxLimit', function(value, element) {
                value = value - 0;
                if(value>maxLimit){
                    return false;
                }else{
                    return true;
                }
            }, '金额不能大于'+maxLimit);

            $.validator.addMethod('minLimit', function(value, element) {
                value = value-0;
                if(value<minLimit){
                    return false;
                }else{
                    return true;
                }

            }, '金额不能小于'+minLimit);


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
