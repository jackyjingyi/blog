/**
 * 选择商务秘书和选择项目负责人
 * Created by wrb on 2018/3/7.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_choice_mytask_handler",
        defaults = {
            title:null,
            isDialog:true,
            projectId:null,
            type:1,//1=商务秘书，2=项目负责人
            selectedUserList:null,
            selectUserCallback:null,
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
            that.initHtmlTemplate();
        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog){//以弹窗编辑
                S_layer.dialog({
                    title: that.settings.title || '选择查看相关人员的我的任务',
                    area : '400px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();
                        if (!flag || that.save()) {
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
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //生成html
        ,initHtmlTemplate:function () {
            var that = this;

            that.getUserList(function (data) {
                var html = template('m_task_issue/m_choice_mytask_handler',{
                    orgUserList:data,
                    selectedUserList:that.settings.selectedUserList
                });
                that.renderDialog(html,function () {
                    that.bindActionClick();
                    if(that.settings.renderCallBack!=null){
                        that.settings.renderCallBack(that.element);
                    }
                });


            });
        }
        //查出人员列表
        ,getUserList:function (callBack) {
            var that = this;
            var options={};
            options.url= restApi.url_listMyTaskHandler;
            m_ajax.get(options,function (response) {
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
                        if (that.settings.selectUserCallback != null) {
                            S_layer.close();
                            var $data = {};
                            $data.userId = $this.attr('data-userId');//用户账户ID
                            $data.companyUserId = $this.attr('data-companyUserId');//组织人员ID
                            $data.userName = $this.parent().parent().find('td:eq(0)').text();
                            $data.id = $this.parents('.ui-dialog-content').attr('id');
                            return that.settings.selectUserCallback($data, $this);

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


