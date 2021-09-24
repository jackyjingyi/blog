/**
 * 项目－外部合作
 * Created by wrb on 2017/5/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectExternalCooperation",
        defaults = {
            projectId:null,
            projectName:null,
            isManager:null,//在当前项目是否是商务秘书1=是
            inviteOuterCooperation:null,//1==重新发送短信
            dataCompanyId:null//视图组织ID
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this._breadcrumb = [
            {
                name: this.settings.businessType==1?'我的项目':'我的课题'
            },
            {
                name:this.settings.projectName,
                url:'#/project/basicInfo?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name:'外部合作'
            }
        ];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._initHtml();
        }
        //初始化数据,生成html
        ,_initHtml:function () {

            var that = this;
            var option = {};
            option.url = restApi.url_getProjectPartnerList;
            option.classId = '';
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
            option.postData.fromCompanyId = window.currentCompanyId;

            if(!isNullOrBlank(that.settings.dataCompanyId))
                option.postData.fromCompanyId = that.settings.dataCompanyId;

            m_ajax.postJson(option, function (response) {
                if (response.code === '0') {

                    var isHasRoleOperate = 0;
                    if((that.settings.isManager!=null && that.settings.isManager==1)
                        || window.currentRoleCodes.indexOf('20000501')>-1){
                        isHasRoleOperate = 1;
                    }
                    var html = template('m_projectExternalCooperation/m_projectExternalCooperation',{
                        projectPartnerList:response.data,
                        isHasRoleOperate:isHasRoleOperate,
                        inviteOuterCooperation:that.settings.inviteOuterCooperation,
                        projectName:that.settings.projectName
                    });
                    $(that.element).html(html);
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
                    that._bindActionClick();
                    rolesControl();

                } else {
                    S_layer.error(response.info);
                }
            });
        }

        //事件绑定
        ,_bindActionClick:function () {
            var that = this;

            $(that.element).find('a[data-action]').on('click',function () {
                var _this = this;
                var dataAction = $(_this).attr('data-action');
                switch (dataAction) {
                    case 'inviteExternalCooperation':

                        $('body').m_inviteExternalCooperation({
                            inviteType:3,
                            projectId:that.settings.projectId,
                            saveCallBack:function () {
                                that._initHtml();
                            }
                        },true);
                        return false;
                        break;
                    case 'relieveRelationship':

                        S_layer.confirm('确定要解除外部合作关系吗？', function () {

                            var option = {};
                            option.url = restApi.url_relieveRelationship+'/'+$(_this).attr('data-id');
                            m_ajax.get(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('操作成功');
                                    that._initHtml();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        return false;
                        break;
                    case 'resendSMS':

                        var option = {};
                        option.classId = 'body';
                        option.url = restApi.url_resendSMS+'/'+$(_this).attr('data-id');
                        m_ajax.get(option, function (response) {
                            if (response.code == '0') {
                                S_toastr.success('发送成功!');
                            } else {
                                S_layer.error(response.info);
                            }
                        });
                        return false;
                        break;
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
