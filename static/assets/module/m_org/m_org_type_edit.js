/**
 * 添加部门，编辑部门
 * Created by wrb on 2016/12/16.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_org_type_edit",
        defaults = {
            title:'',
            isDialog:true,
            dataInfo:null,
            saveCallBack:null//保存回滚事件

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

            var html = template('m_org/m_org_type_edit',{dataInfo:that.settings.dataInfo});
            that.renderDialog(html,function () {
                that.save_validate();
            });
        }
        //初始化数据并加载模板
        ,renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加部门分组',
                    area : '650px',
                    content:html,
                    cancel:function () {

                    },
                    ok:function () {
                        var flag = $(that.element).find('form').valid();
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
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //保存
        ,save:function (e) {
            var that = this;
            var option  = {};
            option.url = restApi.url_saveOrgGroup;
            option.postData = {};
            option.postData.orgName = $(that.element).find('input[name="orgName"]').val();
            option.postData.pid = window.currentCompanyId;

            if(that.settings.dataInfo && that.settings.dataInfo.id!=null){
                option.postData.id = that.settings.dataInfo.id;
                option.postData.companyId = that.settings.dataInfo.companyId;
            }


            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');

                    if(that.settings.saveCallBack!=null)
                        return that.settings.saveCallBack(response.data);

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    orgName:{
                        required:true,
                        maxlength:50
                    }

                },
                messages: {
                    orgName:{
                        required:'请输入部门分组名称!',
                        maxlength:'部门分组名称不超过50位!'
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
