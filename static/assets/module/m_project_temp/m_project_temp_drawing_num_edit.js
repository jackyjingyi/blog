/**
 * 项目模板管理-图纸编号列表-编辑
 * Created by wrb on 2020/3/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_temp_drawing_num_edit",
        defaults = {
            templateId:null,//设计分类ID
            relationId:null,//设计分类relationId
            dataInfo:null,//编辑对象
            isView:false,
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
            that.getData(null,function () {
                var data = $.extend({}, that._dataInfo, that.settings.dataInfo);
                var html = template('m_project_temp/m_project_temp_drawing_num_edit', {
                    dataInfo:data,
                    isView:that.settings.isView
                });
                $(that.element).html(html);
                that.bindActionClick();
            });

        }
        //获取数据
        ,getData:function (id,callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_getFileRuleRoute;
            option.postData = {};
            option.postData.templateId = that.settings.templateId;

            if(that.settings.dataInfo && that.settings.dataInfo.id)
                option.postData.id = that.settings.dataInfo.id;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo = response.data;
                    that.settings.dataInfo = response.data.template;
                    if(callBack)
                        callBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveFileRuleRoute;
            option.postData = {};
            option.postData.templateId = that.settings.templateId;
            option.postData.relationId = that.settings.relationId;
            option.postData.templateName = $(that.element).find('input[name="templateName"]').val();

            var routeList = [];
            $(that.element).find('input[name="itemName"]').each(function (i) {

                var $this = $(this);
                var routeData = {
                    id:$this.attr('data-id'),
                    fileRuleTemplateId:that.settings.templateId,
                    stageDesignRelationId:$this.attr('data-stage-design'),
                    majorDesignRelationId:$this.attr('data-major-design'),
                    name:$this.val()
                };
                routeList.push(filterParam(routeData));

            });
            option.postData.routeList = routeList;

            if(that.settings.dataInfo && that.settings.dataInfo.id)
                option.postData.id = that.settings.dataInfo.id;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){

                    case 'cancel'://取消

                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack();

                        break;

                    case 'save':

                        var templateName = $(that.element).find('input[name="templateName"]').val();
                        if($.trim(templateName)==''){
                            S_toastr.error('请输入编号规则名称！');
                            return false;
                        }
                        that.save();
                        break;

                }
                return false;
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