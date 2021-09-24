/**
 * 部门负责人、审批人设置
 * Created by wrb on 2018/3/7.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_select_user",
        defaults = {
            title:null,
            isDialog:true,
            orgId:null,
            type:1,//1=人员，2=组织
            selectedUserList:null,
            selectUserCallback:null,
            okCallBack:null,
            renderCallBack:null//弹窗回掉方法

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
            var that = this;
            that.getUserList(function (data) {
                var html = template('m_role/m_role_select_user',{
                    orgUserList:data,
                    type:that.settings.type,
                    selectedUserList:that.settings.selectedUserList?that.settings.selectedUserList.join(','):''
                });
                that.renderDialog(html,function () {
                    that.bindActionClick();
                    if(that.settings.renderCallBack!=null){
                        that.settings.renderCallBack(that.element);
                    }
                });
            });
        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog){//以弹窗编辑


                var option = {};
                option.title = that.settings.title || '选择负责人';
                option.area = ['950px','500px'];
                option.content = html;
                option.cancel = function () {};

                if(that.settings.type==1){
                    option.cancelText = '关闭';

                }else{
                    option.ok = function () {



                        var dataList = [];
                        $(that.element).find('a.btn-u-default').each(function () {
                            dataList.push($(this).closest('tr').attr('data-id'));
                        });

                        if(that.settings.okCallBack)
                            that.settings.okCallBack(dataList);
                    };
                }

                S_layer.dialog(option,function(layero,index,dialogEle){//加载html后触发
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
        //查出人员列表
        ,getUserList:function (callBack) {
            var that = this;
            var option={};
            option.url= restApi.url_getOrgUserNoPage;
            option.postData = {};
            if(that.settings.type==2){
                option.url = restApi.url_listChildCompany;
            }else{
                option.postData.orgId = that.settings.orgId;
            }
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    if(callBack!=null){
                        return callBack(response.data);
                    }
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //按钮事件绑定
        , bindActionClick: function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click', function () {

                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'choseUser':

                        if(that.settings.type==1){
                            if (that.settings.selectUserCallback != null) {
                                var $data = {};
                                $data.userId = $this.attr('data-user-id');//用户账户ID
                                $data.companyUserId = $this.attr('data-company-user-id');//组织人员ID
                                $data.userName = $this.closest('tr').find('td:eq(0)').text();
                                $data.id = $this.parents('.ui-dialog-content').attr('id');
                                return that.settings.selectUserCallback($data, $this);
                            }

                        }else{

                            if($this.hasClass('btn-u-primany')){
                                $this.removeClass('btn-u-primany').addClass('btn-u-default');
                            }else{
                                $this.addClass('btn-u-primany').removeClass('btn-u-default');
                            }

                        }

                        break;

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


