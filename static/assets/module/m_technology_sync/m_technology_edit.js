/**
 * 技术协同-编辑
 * Created by wrb on 2018/10/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_technology_edit",
        defaults = {
            isDialog:true,
            type:null,//1.编辑创新委员会 2.编辑成员
            tempData:'',
            cancelCallBack:null,//取消回调
            saveCallBack:null//回调函数
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var   placeholderTitle = '请输入技术委员会描述';
            if(that.settings.type==2){
                placeholderTitle = '请输入委员成员';
            }else  if(that.settings.type==4){
                placeholderTitle = '请输入获奖情况';
            }else  if(that.settings.type==5){
                placeholderTitle = '请输入创新技术委员会信息协同';
            }
            var html = template('m_technology_sync/m_technology_edit', {
                tempData:that.settings.tempData,
                placeholderTitle:placeholderTitle,
            });

            that.renderDialog(html);
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑
                var   dialogTitle = '编辑华侨城创新研究院创新技术委员会';
                if(that.settings.type==2){
                    dialogTitle = '编辑委员成员';
                }else  if(that.settings.type==4){
                    dialogTitle = that.settings.id?'编辑获奖情况':'添加获奖情况';
                }else  if(that.settings.type==5){
                    dialogTitle = that.settings.id?'编辑创新技术委员会信息协同':'添加创新技术委员会信息协同';
                }
                S_layer.dialog({
                    title: that.settings.title||dialogTitle,
                    area : '789.5px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {
                        var flag = $(that.element).find('form').valid();
                        var content = $.trim($(that.element).find('textarea[name="remark"]').val());
                        if(!content&&that.settings.type==4){
                            S_toastr.error('获奖情况不能为空');
                            return false;
                        }
                        if(!content&&that.settings.type==5){
                            S_toastr.error('创新技术委员会信息协同不能为空');
                            return false;
                        }
                        if (!flag || that.save()) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).closest('table').find('tbody').append(html);
                that.element = $(that.element).closest('table').find('tbody tr:last');
                if(callBack)
                    callBack();
            }
        }

        //保存签发
        ,save:function (e) {
            var options={},that=this;
            options.url=restApi.url_saveSkillSynergyInfo;
            options.postData = {};
            options.postData.content = $(that.element).find('textarea[name="remark"]').val();
            options.postData.type = that.settings.type ;
            options.postData.id = that.settings.id ;
            options.postData.companyId = that._currentCompanyId;
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data,e);
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
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
