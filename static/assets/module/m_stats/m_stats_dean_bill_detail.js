/**
 * 任务签发-状态流转
 * Created by wrb on 2018/9/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_dean_bill_detail",
        defaults = {
             isDialog:true
            ,dataInfo:null
            ,saveCallBack:null
            ,doType:1//默认1=签发,2=生产
            ,isPanel:0//1=父
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_stats/m_stats_dean_bill_detail',{
                dataList:that.settings.dataList,
                year:that.settings.year,
                type:that.settings.type,
                fee:that.settings.fee,
                userName:that.settings.userName
            });
            that.renderDialog(html,function () {
                that.bindActionClick();
            });
        }
        //渲染列表内容
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title:that.settings.title || '查看经营收入详情',
                    area : '950px',
                    fixed:true,
                    scrollbar:false,
                    content:html,
                    btn:false

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }

        }
        //渲染list
        ,renderDataList:function (t) {
            var that = this;

            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listDeanBillPerson;
            option.postData = {};
            option.postData.year =that.settings.year;
            option.postData.type =  that.settings.type;
            option.postData.companyUserId =  that.settings.companyUserId;
            that._year = $(that.element).find('input[name="year"]').val();
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that.settings.dataList = response.data;
                    that.init();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //事件绑定
        , bindActionClick: function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').on('click',function () {
                var $this = $(this), dataAction = $this.attr('data-action');
                switch (dataAction) {
                    case 'addFee'://新增金额
                      var  value = {
                            backFee:that.settings.fee,
                            type:that.settings.type
                        };
                        $this.m_editable({
                            title:'新增修正金额',
                            value:value,
                            btnRight:true,
                            isNotSet:false,
                            isInitAndStart:true,
                            ok:function (data) {
                                if(data==false)
                                    return false;
                                var $data = data;
                                $data.companyUserId = that.settings.companyUserId;
                                $data.type=that.settings.type
                                that.saveDeanBillStatistic($data)
                            },
                            cancel:function () {

                            }
                        },true);

                        break;
                    case 'editFee'://新增金额
                        var  value = {
                            backFee:that.settings.fee,
                            fee:$this.attr('data-fee'),
                            modifyDate:$this.attr('data-modify-date'),
                            remark:$this.attr('data-remark'),
                            contractNo:$this.attr('data-contract-no'),
                            type:that.settings.type
                        };
                        $this.m_editable({
                            title:'编辑修正金额',
                            value:value,
                            btnRight:true,
                            isNotSet:false,
                            isInitAndStart:true,
                            ok:function (data) {
                                if(data==false)
                                    return false;
                                var $data = data;
                                $data.companyUserId = that.settings.companyUserId;
                                $data.id = $this.attr('data-id');
                                $data.type=that.settings.type
                                that.saveDeanBillStatistic($data)
                            },
                            cancel:function () {

                            }
                        },true);

                        break;
                    case "delFee":
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var option = {};
                            option.url = option.url = restApi.url_deleteDeanBillStatisticById+'/'+ $this.attr('data-id');
                            option.type = 'DELETE';
                            m_ajax.get(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.renderDataList();
                                    if(that.settings.saveCallBack)
                                        that.settings.saveCallBack();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        return false;
                        break;
                }
            });
        }

        //编辑节点名称，金额，明细金额
        ,saveDeanBillStatistic:function (data) {
            var that = this,option  = {},isError = false;
            option.classId = that.element;
            option.url = restApi.url_saveDeanBillStatistic;
            option.postData = data;
            option.postData.year = that.settings.year;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.renderDataList();
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_layer.error(response.info);
                    isError = true;
                }
            });
            return isError;
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
