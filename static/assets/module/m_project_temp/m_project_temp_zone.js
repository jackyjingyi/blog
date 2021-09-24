/**
 * 公司关系配置
 * Created by wrb on 2020/6/11.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_temp_zone",
        defaults = {
            postParam:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._dataList = [];

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getZoneList(function () {
                var html = template('m_project_temp/m_project_temp_zone', {
                    dataList:that._dataList
                });
                $(that.element).html(html);
                that.bindActionClick();
                rolesControl();
            });
        }
        ,getZoneList:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listZone;
            option.postData = {};

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._dataList = response.data;
                    if(callBack)
                        callBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action'),dataId = $this.closest('tr').attr('data-id');
                var dataItem = getObjectInArray(that._dataList,dataId);

                switch (dataAction){
                    case 'add'://编辑

                        $(that.element).m_project_temp_zone_edit({
                            saveCallBack:function () {
                                that.init();
                            }
                        });

                        break;
                    case 'edit'://编辑

                        $(that.element).m_project_temp_zone_edit({
                            dataInfo:dataItem,
                            saveCallBack:function () {
                                that.init();
                            }
                        });

                        break;
                    case 'delete'://删除

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_deleteZone;
                            option.postData = {id:dataId};
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.init();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });

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
