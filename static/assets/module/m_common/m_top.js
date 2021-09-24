/**
 * Created by veata on 2017/02/14.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_top",
        defaults = {
            data: null,
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            this.initHtml();
        },
        initHtml: function () {
            var that = this;

            //请求基础数据
            var option = {};
            option.url = restApi.url_getCurrUserOfWork;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    if (response.data != null) {

                        if(response.data.companyInfo==null)
                            window.location.hash = '/createOrg/1';


                        //设置组织全局变量
                        //window.socketUrl = response.data.scoketUrl;
                        //window.fastdfsUrl = response.data.fastdfsUrl;
                        //window.fileCenterUrl = response.data.fileCenterUrl;
                        //window.enterpriseUrl = response.data.enterpriseUrl;
                        //window.cdnUrl = response.data.cdnUrl;
                        window.userInfo = response.data.userInfo;
                        window.companyInfo = response.data.companyInfo;
                        window.companyUserInfo = response.data.companyUser;
                        window.currentCompanyId = response.data.companyInfo?response.data.companyInfo.id:'';
                        window.currentUserId = response.data.userInfo?response.data.userInfo.id:'';
                        window.currentCompanyUserId = response.data.companyUser?response.data.companyUser.id:'';
                        window.currentRoleCodes = response.data.roleCodes==null?'':response.data.roleCodes;
                        window.companyVersion = response.data.companyVersion;
                        window.adminFlag = response.data.adminFlag;//组织解散标识
                        window.viewAllProject = response.data.viewAllProject;//权限-项目总览

                        window.role = {
                            isHasChildOrg:response.data.isHasChildOrg,
                            isRootCompany:response.data.isRootCompany,
                            viewProjectCostForOrg:response.data.viewProjectCostForOrg
                        };
                        window.baBie = {
                            userId:response.data.baBieAccountId,
                            entId:response.data.entId,
                            depId:response.data.depId
                        };

                        var html = template('m_common/m_top', response.data);
                        $('#m_top').html(html);

                        rolesControl();
                        that.bindActionClick();
                        $.each($('#top-nav li'), function (i, o) {
                            var $el = $(o);
                            if ($el.data('nav') === currentNav)
                                $el.addClass('active');
                        });

                        var oLi=$('#m_top_orgList');
                        if(oLi.find('li').length==0){
                            oLi.prev().find('.caret').remove();
                            oLi.remove()
                        }

                        if(response.data.yearNum>0){
                            $('body').m_tips_anniversary_card({yearNum:response.data.yearNum});
                        }

                        if(that.settings.resolve)
                            that.settings.resolve('top-render');

                        if(that.settings.renderCallBack)
                            that.settings.renderCallBack();
                    }
                    that.renderToolTip();
                    that.renderTodoList();
                } else {
                    S_layer.error(response.info);
                }
            });


        }
        //渲染待办任务
        ,renderTodoList:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_listMyTaskUnComing;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    if (response.data != null) {
                        that._dataInfo = {childList: response.data.data};
                        if(response.data.total!=null&&response.data.total>0){
                            $('#unReadTodoCount').addClass('unReadTodoCount');
                            $('#unReadTodoCount').html(response.data.total);
                        }else{
                            $('#unReadTodoCount').removeClass('unReadTodoCount');
                            $('#unReadTodoCount').html('');
                        }
                        if(response.data.total>0){
                            $('body').m_todo_card({dataInfo:that._dataInfo});
                        }
                    }
                }else {
                    S_layer.error(response.info);
                }
                });
        }

        //渲染ToolTip
        , renderToolTip: function () {
            $('.tooltip-demo').tooltip({
                selector: '[data-toggle=tooltip]',
                container: 'body',
                trigger: 'hover'
            });
        }
        , switchOrg: function (orgId) {
            var option = {};
            option.url = restApi.url_switchCompany + '/' + orgId;
            m_ajax.getJson(option, function (response) {
                if (response.code == '0') {
                    window.location.href = window.serverPath + '/iWork/home/workbench';
                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //事件绑定
        , bindActionClick: function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click', function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction) {
                    case 'switchOrg'://切换组织
                        var companyInfoId = window.currentCompanyId;
                        var orgId = $(this).attr('org-id');
                        if (orgId != companyInfoId) {
                            that.switchOrg(orgId);
                        }
                        return false;
                        break;
                    case 'messageCenter'://消息界面
                        location.hash = '/messageCenter';
                        $('#unReadMessageCount').html('');
                        break;
                    case 'backstageMgt'://后台管理

                        location.hash = '/backstageMgt';
                        break;
                    case 'personalSettings'://个人设置
                        location.hash = '/personalSettings';
                        break;
                    case 'companyUserSettings'://个人设置(个人在部门中的信息)
                        var options = {};
                        $('body').m_editUserByMySelf(options);
                        break;
                    case 'announcement'://公告
                        location.hash = '/announcement';
                        break;
                    case 'myTodoList'://我的待办
                        location.hash = '/myTodoList';
                        break;
                    case 'createOrg'://创建组织
                        location.hash = '/createOrg';
                        break;
                    /*case 'financeSettings'://财务设置
                        var option = {};
                        option.isFirstEnter = true;
                        $('#content-right').m_financeSettings_menu(option);
                        that.dealMenuShowOrHide(0);
                        break;*/
                }
            })
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
