/**
 * Created by wrb on 2016/12/14.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_userList",
        defaults = {
              orgId : ''
            , userUrl : ''
            , selectUserCallback : null
            , selectedUserList : null //选中的人员列表[{id,userId,userName}...]
            , selectedDisabled : true //选中的disabled
            , isASingleSelectUser : false //是否单个选择人员，默认false,2为单选且提示不关窗
            , orgUserList:[]
            , renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._selectedUserIds = '';

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.initUserData(function () {
                that.dealSelectedUserList();
                that.bindActionClick();
                if (that.settings.selectedDisabled==true)
                    that.dealSelectedUserBtnClass();
                if(that.settings.renderCallBack)
                    that.settings.renderCallBack();
            });
        }
        //人员数据并加载模板
        , initUserData: function (callBack) {
            var that = this;
            if(that.settings.orgUserList && that.settings.orgUserList.length>0){

                var html = template('m_org/m_userList', {orgUserList:that.settings.orgUserList});
                $(that.element).html(html);
                if(callBack)
                    callBack();

            }else{
                var url = that.settings.userUrl != null && that.settings.userUrl != '' ? that.settings.userUrl : restApi.url_getOrgUser;
                var params = {};
                params.orgId = that.settings.orgId;
                paginationFun({
                    eleId: '#userlist-pagination-container',
                    loadingId: '.userListBox',
                    url: url,
                    params: params
                }, function (response) {

                    var $data = {};
                    $data.orgUserList = response.data.data;
                    var html = template('m_org/m_userList', $data);
                    $(that.element).html(html);
                    if(callBack)
                        callBack();
                });
            }
        }
        //处理按钮样式与可否点击
        , dealSelectedUserBtnClass: function () {
            var that = this;
            $(that.element).find('a[data-action="selectUser"]').each(function () {
                var id = $(this).attr('data-companyUserId');
                if (that._selectedUserIds != null && that._selectedUserIds.indexOf(id) > -1) {
                    $(this).addClass('btn-u-default');
                    $(this).css('cursor', 'default');
                } else {
                    $(this).removeClass('btn-u-default');
                    $(this).css('cursor', 'pointer');

                }
            });
        }
        //把已选的人员列表转为id集合字符串，用于来作判断
        , dealSelectedUserList: function () {
            var that = this;
            if (that.settings.selectedUserList != null) {
                that._selectedUserIds = '';
                var list = that.settings.selectedUserList;
                for (var i = 0; i < list.length; i++) {
                    that._selectedUserIds += list[i].id + ',';
                }
            }
        }
        //按钮事件绑定
        , bindActionClick: function () {
            var that = this;
            $('.userListBox a[data-action]').on('click', function () {

                var $this = $(this);
                if ($this.attr('data-action') == "selectUser") {//选择用户

                    if ($this.hasClass('btn-u-default')) {//已置灰
                        return false;
                    }

                    if (that.settings.isASingleSelectUser || that.settings.isASingleSelectUser == 2) {//单选且不关窗，这里把原selectedUserList设为空

                        that.settings.selectedUserList = [];
                    }

                    if (that.settings.selectUserCallback != null) {
                        var $data = {};
                        $data.userId = $this.attr('data-userId');//用户账户ID
                        $data.companyUserId = $this.attr('data-companyUserId');//组织人员ID
                        $data.userName = $this.parent().parent().find('td:eq(0)').text();
                        $data.id = $this.parents('.layui-layer').attr('times');
                        $data.fileFullPath = $this.attr('data-head-img');//用户账户ID

                        if (that.settings.selectedUserList == null) {

                            that.settings.selectedUserList = [];
                        }
                        //每选中，就在selectedUserList添加人员记录
                        that.settings.selectedUserList.push({
                            id: $data.companyUserId,
                            userName: $data.userName,
                            userId:$data.userId,
                            fileFullPath:$data.fileFullPath,
                            orgType:2//1=部门负责人，2=成员
                        });
                        $data.selectedUserList = that.settings.selectedUserList;

                        that.dealSelectedUserList();
                        if (that.settings.selectedDisabled==true)
                            that.dealSelectedUserBtnClass();

                        $data.selectedUserIds = that._selectedUserIds;

                        return that.settings.selectUserCallback($data, $this);
                    }
                }
            });
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
