/**
 * 表单生成界面，并保存
 * Created by wrb on 2018/9/20.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_form_template_generate_details",
        defaults = {
             isDialog:true
            ,type:1//1=我的审批
            ,preTitle:null//标题前缀
            ,dataInfo:null
            ,isView:false//是否展示
            ,isShowBtn:true
            ,closeCallBack:null
            ,saveCallBack:null
            ,renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;
        this._currentCompanyUserId = window.currentCompanyUserId;

        this._uploadmgrContainer = null;
        this._uuid = UUID.genV4().hexNoDelim;//targetId

        this._dataInfo = {};

        this._webpArr = [];//webp解码后的数组
        this._isSupportWebp = checkSupportWebp();

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var option = {};
            option.url = restApi.url_initDynamicAudit;
            option.postData = {
                id:that.settings.dataInfo.id
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._dataInfo = response.data;

                    var html = template('m_form_template/m_form_template_generate_details',{
                        dataInfo:that._dataInfo,
                        currentCompanyUserId:that._currentCompanyUserId,
                        isView:that.settings.isView,
                        isShowBtn:that.settings.isShowBtn
                    });
                    that.renderDialog(html,function (layero,index,dialogEle) {


                        var expAmount = 0,isShowStatistics=false,fieldUnit = '';
                        $(that.element).find('div[data-statistics="1"]').each(function () {
                            //expAmount = expAmount + parseFloat($(this).attr('data-value')-0);
                            var amount = $(this).attr('data-value')-0;
                            expAmount = math.add(math.bignumber(expAmount),math.bignumber(amount));
                            fieldUnit = $(this).attr('data-field-unit');
                            isShowStatistics = true;
                        });
                        expAmount = math.string(expAmount);
                        if(isShowStatistics){
                            $(that.element).find('#isShowStatistics').show();
                            if(fieldUnit=='元'||fieldUnit=='万元')
                                expAmount = expNumberFilter(expAmount);
                            $(that.element).find('#isShowStatistics #expAmount').html(expAmount+''+fieldUnit);
                        }
                        //that.webpDecodingInit();

                        if(that._dataInfo.dynamicAudit.type=='projectSetUp' || that._dataInfo.dynamicAudit.type=='contractAudit'){
                            that.renderApprovalDetails(that._dataInfo.dynamicAudit.type,function () {
                                that.bindActionClick();
                                if(that.settings.renderCallBack)
                                    that.settings.renderCallBack();
                            });


                        }else if(that._dataInfo.dynamicAudit.type=='expApply'){

                            $(that.element).find('#approvalDetailsBox').m_approval_exp_details({
                                isDialog:false,
                                id:that._dataInfo.dynamicAudit.id,
                                renderCallBack:function () {
                                    that.bindActionClick();

                                    if(that._layero)
                                        S_layer.resize(that._layero.layero,that._layero.index,that._layero.dialogEle);

                                    if(that.settings.renderCallBack)
                                        that.settings.renderCallBack();
                                }
                            });

                        }else if(that._dataInfo.dynamicAudit.type=='singleFundChange'){

                            $(that.element).find('#approvalDetailsBox').m_approval_capital_changes_details({
                                isDialog:false,
                                id:that._dataInfo.dynamicAudit.id,
                                renderCallBack:function () {
                                    that.bindActionClick();

                                    if(that._layero)
                                        S_layer.resize(that._layero.layero,that._layero.index,that._layero.dialogEle);

                                    if(that.settings.renderCallBack)
                                        that.settings.renderCallBack();
                                }
                            });

                        }else if(that._dataInfo.dynamicAudit.type=='verification'){

                            $(that.element).find('#approvalDetailsBox').m_approval_cost_off_details({
                                isDialog:false,
                                id:that._dataInfo.dynamicAudit.id,
                                renderCallBack:function () {
                                    that.bindActionClick();

                                    if(that._layero)
                                        S_layer.resize(that._layero.layero,that._layero.index,that._layero.dialogEle);

                                    if(that.settings.renderCallBack)
                                        that.settings.renderCallBack();
                                }
                            });

                        }else{

                            that.bindActionClick();

                            if(that._layero)
                                S_layer.resize(that._layero.layero,that._layero.index,that._layero.dialogEle);

                            if(that.settings.renderCallBack)
                                that.settings.renderCallBack();

                        }

                        return false;
                    });

                } else {
                    S_layer.error(response.info);
                }
            });

        }
        //渲染列表内容
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                var title = that._dataInfo.formName;
                if(!isNullOrBlank(title)){
                    if(that._dataInfo.dynamicAudit && that._dataInfo.dynamicAudit.auditList && that._dataInfo.dynamicAudit.auditList.length>0)
                        title  = that._dataInfo.dynamicAudit.auditList[0].userName + '-' + title;
                }
                if(that.settings.preTitle)
                    title = that.settings.preTitle + '-' + that._dataInfo.formName;

                if(that._dataInfo && !isNullOrBlank(that._dataInfo.auditTitle))
                    title = that._dataInfo.auditTitle;


                S_layer.dialog({
                    title:title || '我的审批',
                    area : '980px',
                    fixed:true,
                    //scrollbar:false,
                    content:html,
                    btn:false

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    that._layero = {
                        layero:layero,
                        index:index,
                        dialogEle:dialogEle
                    };
                    if(callBack)
                        callBack(layero,index,dialogEle);
                    //S_layer.resize(layero,index,dialogEle);

                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }

        }
        //初始化iCheck
        ,renderICheckOrSelect:function ($ele) {

            var that = this;
            var ifChecked = function (e) {
            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {
            };
            $ele.find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);

            $ele.find('select').select2({
                tags:false,
                allowClear: false,
                minimumResultsForSearch: -1,
                width:'100%',
                language: "zh-CN"
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'cancel'://取消
                        S_layer.close($(that.element));
                        break;

                    case 'agree'://同意
                        var option = {};
                        option.dataInfo = {
                            id:that.settings.dataInfo.id,
                            isFreeProcess:that._dataInfo.isFreeProcess
                        };
                        option.doType = 1;
                        option.parentElement = that.element;
                        option.saveCallBack = function () {
                            that.init();
                            if(that.settings.saveCallBack)
                                that.settings.saveCallBack();
                        };
                        $('body').m_approval_operational_comments(option,true);

                        break;
                    case 'returnBack'://退回

                        var option = {};
                        option.dataInfo = {
                            id:that.settings.dataInfo.id,
                            isFreeProcess:that._dataInfo.isFreeProcess
                        };
                        option.doType = 2;
                        option.saveCallBack = function () {
                            that.init();
                            if(that.settings.saveCallBack)
                                that.settings.saveCallBack();
                        };
                        $('body').m_approval_operational_comments(option,true);

                        break;
                    case 'cancellation'://撤销

                        var option = {};
                        option.dataInfo = {
                            id:that.settings.dataInfo.id,
                            isFreeProcess:that._dataInfo.isFreeProcess
                        };
                        option.doType = 3;
                        option.saveCallBack = function () {
                            that.init();
                            if(that.settings.saveCallBack)
                                that.settings.saveCallBack();
                        };
                        $('body').m_approval_operational_comments(option,true);

                        break;
                    case 'preview'://查看文件

                        var fileExt = $this.attr('data-file-ext');
                            fileExt = fileExt.toLowerCase();
                        var fileUrl = $this.attr('data-src');
                        var imgSrcArr = [];
                        if('gif,jpg,jpeg,bmp,png'.indexOf(fileExt)>-1){
                            var index = 0,currentIndex = 0;
                            $(that.element).find('a[data-action="preview"]').each(function (i) {
                                var url = $(this).attr('data-src');
                                var ext = $this.attr('data-file-ext');
                                if('gif,jpg,jpeg,bmp,png'.indexOf(ext)>-1){
                                    imgSrcArr.push({
                                        src:url,
                                        thumb:url
                                    });
                                    if(fileUrl==url){
                                        currentIndex = index;
                                    }
                                    index ++;
                                }

                            });
                            S_layer.photos(imgSrcArr,currentIndex);
                        }else{
                            window.open(fileUrl);
                        }


                        break;
                    case 'remind'://提醒

                        that.remindApprover();
                        break;
                }
                return false;

            });
        }
        ,webpDecodingInit:function () {
            var that = this;
            if(that._dataInfo.dynamicAudit && that._dataInfo.dynamicAudit.attachList && that._dataInfo.dynamicAudit.attachList.length>0){
                var attachList = that._dataInfo.dynamicAudit.attachList;
                $.each(attachList,function (i,item) {
                    convertImgToBase64(item.fileFullPath, function(base64Img){
                        //转化后的base64
                        that._webpArr.push({
                            src:base64Img,
                            thumb:item.fileFullPath,
                            fileId:item.id
                        });
                    });
                });
            }
        }
        //项目详情单独处理
        ,renderApprovalDetails:function (type,callBack) {
            var that = this;
            $(that.element).find('#approvalDetailsBox').m_projectBasicInfo({
                isView:true,
                projectId:that._dataInfo.dynamicAudit.relationId,
                mainId:that._dataInfo.dynamicAudit.id,
                isLoadDataByMainId:true,
                doType:type=='projectSetUp'?2:3,
                renderCallBack:function () {
                    if(that._layero)
                        S_layer.resize(that._layero.layero,that._layero.index,that._layero.dialogEle);

                    if(callBack)
                        callBack();
                }
            },true);
        }
        //提醒审批人请求
        ,remindApprover:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_remindAuditPerson;
            option.postData = {id:that.settings.dataInfo.id};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('操作成功！');
                }else {
                    S_layer.error(response.info);
                }
            })
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
