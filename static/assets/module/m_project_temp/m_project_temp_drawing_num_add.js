/**
 * 项目模板管理-图纸编号列表-添加
 * Created by wrb on 2020/3/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_temp_drawing_num_add",
        defaults = {
            isDialog:true,
            templateId:null,//设计分类ID
            relationId:null,//设计分类relationId
            saveCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._dataInfo = {};
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_temp/m_project_temp_drawing_num_add', {});
            that.renderDialog(html,function () {
                that.save_validate();

            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加设计分类',
                    area : ['650px'],
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
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveFileRuleTemplate;
            option.postData = $(that.element).find("form").serializeObject();
            option.postData.templateId = that.settings.templateId;
            option.postData.relationId = that.settings.relationId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack(response.data);


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form').validate({
                ignore : [],
                rules: {
                    templateName:{
                        required: true
                    }
                },
                messages: {
                    templateName:{
                        required: '请输入编号规则名称！'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
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