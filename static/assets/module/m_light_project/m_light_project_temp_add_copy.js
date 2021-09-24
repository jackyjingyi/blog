/**
 * 普通模板添加
 * Created by wrb on 2019/12/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_temp_add_copy",
        defaults = {
            isDialog:true,
            saveCallBack:null
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
            var html = template('m_light_project/m_light_project_temp_add_copy', {
                dataInfo:that.settings.dataInfo
            });
            that.renderDialog(html,function () {

                that.initSelect2();
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'复制现有协同任务制作模板',
                    area : '400px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var $project = $(that.element).find('select[name="projectList"] option:selected');
                        if($project.val()==''){
                            S_toastr.warning('请选择协同任务');
                            return false;
                        }else{

                            var dataInfo = {
                                projectName:$project.text(),
                                templateId:$project.val()
                            };
                            if(that.settings.saveCallBack)
                                that.settings.saveCallBack(dataInfo);
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
        ,initSelect2:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_listLightProject;
            option.postData = {};

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var data = [{id:'',text:'请选择'}];
                    if(response.data.data){
                        $.each(response.data.data,function (i,item) {
                            data.push({id:item.id,text:item.projectName});
                        });
                    }

                    $(that.element).find('select[name="projectList"]').select2({
                        tags:false,
                        allowClear: false,
                        //containerCssClass:'select-sm',
                        language: "zh-CN",
                        //placeholder:'请选择任务',
                        minimumResultsForSearch: 0,
                        data:data
                    });

                } else {
                    S_layer.error(response.info);
                }
            });

        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
