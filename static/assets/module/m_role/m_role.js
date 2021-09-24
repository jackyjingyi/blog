/**
 *  权限配置
 * Created by wrb on 2018/11/21.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role",
        defaults = {
            getDataUrl: null,
            doType:1//1=个人权限，2=部门权限

        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._selectedRole = null;//选中的角色对象
        this._leftBoxHeightResize = null;//左边div高度自适应设定初始对象

        this._leaderList = null;//负责人列表
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }
        , renderPage: function () {

            var that = this;
            var $data = {
                doType:that.settings.doType
            };
            var html = template('m_role/m_role', $data);
            $(that.element).html(html);

            that.renderRoleList();
            rolesControl();

            that._leftBoxHeightResize = new leftBoxHeightResize($(that.element).find('#role-out-box'),$(that.element).find('#role-box'),$(that.element).find('#view-box'),108);
            that._leftBoxHeightResize.init();

        }
        //渲染角色列表
        ,renderRoleList:function () {
            var that = this;
            $(that.element).find('#role-box').m_role_list({
                selectedRole:that._selectedRole,
                doType:that.settings.doType,
                selectedCallBack:function (data) {
                    that._selectedRole = data;//选中的角色对象

                    var activeHref = $(that.element).find('#view-box .nav-tabs li.active a').attr('href');
                    var html = template('m_role/m_role_content', {selectedRole:that._selectedRole,doType:that.settings.doType});
                    $(that.element).find('#view-box').html(html);

                    that.bindActionClick();
                    that.renderRoleView();
                    that.renderRoleUser();

                    var t = setTimeout(function () {
                        $(that.element).find('#view-box .nav-tabs li a[href="'+activeHref+'"]').click();
                        clearTimeout(t);
                    },10);

                }
            },true);
        }
        //渲染功能权限
        ,renderRoleView:function () {
            var that = this;
            var option = {};
            option.role = that._selectedRole;
            option.doType = that.settings.doType;
            option.renderCallBack = function () {

                $(that.element).find('#view-box a[data-toggle="tab"]').on('click',function () {
                    that._leftBoxHeightResize.setHeight();
                });
            };
            $(that.element).find('#role-view-box').m_role_view(option,true);
        }
        //刷新人员列表
        ,renderRoleUser:function () {
            var that = this;
            if(that.settings.doType==1){
                $(that.element).find('#role-users-box').m_role_users({
                    role:that._selectedRole,
                    leaderList:that._leaderList,
                    doType:that.settings.doType,
                    renderCallBack:function (data) {

                        //当为负责人
                        if(that._selectedRole.id=='10001'){
                            that._leaderList = data;
                        }
                        
                    }
                },true);
            }else{
                $(that.element).find('#role-users-box').m_role_org({
                    role:that._selectedRole,
                    doType:that.settings.doType
                },true);
            }
        }
        //事件绑定
        , bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'addRole'://添加角色
                        var option = {};
                        option.doType = that.settings.doType;
                        if(that.settings.doType==2)
                            option.title = '新建部门类型';

                        option.saveCallBack = function () {
                            //刷新角色列表
                            that.renderRoleList();
                        };
                        $('body').m_role_add(option,true);
                        return false;
                        break;
                    case 'addGroup'://添加分组
                        var option = {};
                        option.doType = that.settings.doType;
                        if(that.settings.doType==2)
                            option.title = '新建部门分组';

                        option.saveCallBack = function () {
                            that.renderRoleList();
                        };
                        $('body').m_role_group_add(option,true);
                        return false;
                        break;

                    case 'setRule'://添加规则

                        $('body').m_role_set_operator_rule({ruleType:$this.attr('data-type')},true);
                        return false;
                        break;

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
