/**
 * 邀请人员
 * Created by wrb on 2016/12/17.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_inviteCorp",
        defaults = {
            title: '',
            inivteUserUrl: '',
            isDialog: true,
            inviteType:1 //1：分支机构 2：事业合伙人
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_org/m_inviteCorp', {inviteType:that.settings.inviteType});
            that.renderDialog(html,function () {
                $('.inviteCorpBox').closest('.dialogOBox').css('overflow','inherit');
                that.bindSendMessage();
            });
        }
        //初始化数据并加载模板
        , renderDialog: function (callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑
                S_layer.dialog({
                    title: that.settings.title || that.settings.inviteType===1?'邀请分支机构':'邀请事业合伙人',
                    area : '460px',
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
        //按钮事件绑定
        , bindSendMessage: function () {
            var that = this;
            $('a[data-action="sendMessage"]').click(function (e) {
                var $btn=$(this);
                var $input=$('.inviteCorpBox').find('input[name="bPartnerPhone"]:eq(0)');
                var phone=$input.val();
                var pattern = /^1\d{10}$/;
                if(isNullOrBlank(phone)||!pattern.test(phone))
                {
                    S_toastr.warning('请输入11位有效手机号码');
                    return false;
                }

                S_layer.confirm('确定要发送邀请给“'+phone+'”吗?', function () {

                    var cellphoneList = [];
                    cellphoneList.push(phone);
                    var option = {};
                    option.url = restApi.url_inviteBPartner;
                    option.classId = '.inviteBPartnerBox';
                    option.postData = {cellphoneList: cellphoneList,type:that.settings.inviteType};
                    m_ajax.postJson(option, function (response) {
                        if (response.code == '0') {
                            S_toastr.success("邀请"+(that.settings.inviteType===1?'分支机构':'事业合伙人')+"短信已发送");
                            S_layer.close($(e.target));
                        } else {
                            S_layer.error(response.info);
                        }
                    });

                }, function () {
                });

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
