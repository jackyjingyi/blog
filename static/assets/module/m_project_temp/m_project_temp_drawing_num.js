/**
 * 项目模板管理-图纸编号设置
 * Created by wrb on 2020/3/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_temp_drawing_num",
        defaults = {
            renderCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._dataInfo = {};
        this._projectTypeList = [];
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function (selectId) {
            var that = this;
            that.getData(null,function (data) {
                var html = template('m_project_temp/m_project_temp_drawing_num', {
                    projectTypeList:data
                });
                $(that.element).html(html);
                if(selectId)
                    $(that.element).find('.panel[data-type="1"] .list-group-item[data-id="'+selectId+'"]').addClass('active').siblings().removeClass('active');

                that.renderContent();

            });

        }
        //渲染编号规则列表
        ,renderContent:function () {
            var that = this;
            var id = $(that.element).find('.list-group-item.active').attr('data-id');
            that.getListFileRule(id,function (data) {

                var html = template('m_project_temp/m_project_temp_drawing_num_list', {dataList:data});
                $(that.element).find('.panel-body[data-type="drawingNumberList"]').html(html);

                that.bindActionClick();
                that.initItemICheck();

            });
        }
        //获取数据
        ,getData:function (id,callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listProjectTemplate;
            option.postData = {pid:id};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._projectTypeList = response.data;
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //获取数据
        ,getListFileRule:function (id,callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listFileRule;
            option.postData = {templateId:id};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //初始ICheck
        , initItemICheck:function () {
            var that = this;

            var ifChecked = function (e) {
                that.startFileRule($(this).closest('tr').attr('data-id'));
            };
            var ifUnchecked = function (e) {

            };
            $(that.element).find('input[name="itemCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //启用图纸编码规则
        ,startFileRule:function (id) {
            var option = {};
            option.url = restApi.url_startFileRule;
            option.postData = {
                id: id
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功！');
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //删除图纸编码规则
        ,deleteFileRule:function (id) {
            var that = this;
            var option = {};
            option.url = restApi.url_deleteFileRule;
            option.postData = {
                id: id
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功！');
                    that.renderContent();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                var projectTypeId = $(that.element).find('.list-group-item.active').attr('data-id');
                var relationId = $(that.element).find('.list-group-item.active').attr('data-relation-id');

                switch (dataAction){

                    case 'selectItem'://选中

                        $this.parent().addClass('active').siblings().removeClass('active');
                        that.renderContent();
                        break;
                    case 'addDrawingNum'://添加
                        $('body').m_project_temp_drawing_num_add({
                            templateId:projectTypeId,
                            relationId:relationId,
                            saveCallBack:function (data) {
                                if(data && data.id){
                                    $(that.element).m_project_temp_drawing_num_edit({
                                        templateId:projectTypeId,
                                        relationId:relationId,
                                        dataInfo:data,
                                        saveCallBack:function () {
                                            that.init(projectTypeId);
                                        }
                                    });
                                }else{
                                    that.init(projectTypeId);
                                }
                            }
                        });

                        break;
                    case 'editDrawingNum'://编辑
                    case 'viewDrawingNum'://编辑
                        var dataId = $this.closest('tr[data-id]').attr('data-id');
                        var dataItem = getObjectInArray(that._dataInfo,dataId);
                        $(that.element).m_project_temp_drawing_num_edit({
                            templateId:projectTypeId,
                            relationId:relationId,
                            dataInfo:dataItem,
                            isView:dataAction=='viewDrawingNum'?true:false,
                            saveCallBack:function () {
                                that.init(projectTypeId);
                            }
                        });

                        break;

                    case 'delDrawingNum'://删除

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            that.deleteFileRule($this.closest('tr').attr('data-id'));

                        }, function () {
                        });

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
