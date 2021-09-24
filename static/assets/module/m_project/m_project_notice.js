/**
 * 基本信息－项目动态
 * Created by wrb on 2020/6/18.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_notice",
        defaults = {
            title:null,
            isDialog:true,
            projectId:null,
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._pageIndex = 0;
        this._pageSize = 10;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_project/m_project_notice',{});
            $(that.element).html(html);
            that.renderContent(1)
        }
        /**
         *
         * @param t=1,第一次渲染
         * @param callBack
         */
        ,renderContent:function (t,callBack) {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_noticeByProjectId;
            option.postData = {
                projectId:that.settings.projectId,
                pageSize:that._pageSize,
                pageIndex:that._pageIndex
            };
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    if(response.data.data && response.data.data.length>0){
                        $(that.element).find('.no-data').remove();
                        var html = template('m_project/m_project_notice_item',{dataList:response.data.data});
                        $(that.element).find('.project-notice').append(html);
                        var pageTotal = (that._pageIndex+1)*that._pageSize;
                        if(pageTotal>=response.data.total){
                            $(that.element).find('a[data-action="btnPageNext"]').hide();
                        }else{
                            $(that.element).find('a[data-action="btnPageNext"]').show();
                        }
                        that._pageIndex++;
                        that.bindActionClick();

                    }else if(t==1){

                        $(that.element).find('.no-data').show();
                    }
                    rolesControl();
                    if(callBack)
                        callBack(response.data.data);

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {

                var $this = $(this),dataAction=$this.attr('data-action');

                switch (dataAction){
                    case 'btnPageNext':
                        that.renderContent(0,function (data) {
                            if(data==null || data.length==0){
                                $this.parent().html('<p class="fc-v1-grey">没有更多数据了</p>');
                            }
                        });
                        break;
                    case 'editProjectNotice'://编辑项目动态

                        $('body').m_project_notice_edit({
                            projectId:that.settings.projectId,
                            title:that.settings.businessType==1?'编辑项目动态':'编辑课题动态',
                            dataInfo:{
                                id:$this.closest('.vertical-timeline-block').attr('data-id'),
                                noticeTitle:$this.closest('.vertical-timeline-block').find('h4').attr('data-value'),
                                noticeContent:$this.closest('.vertical-timeline-block').find('p.noticeContent').html(),
                                noticePublishdate:$this.closest('.vertical-timeline-block').find('p.noticePublishdate').attr('data-value')
                            },
                            saveCallBack:function (data) {
                                var dataList = [];
                                dataList.push(data);
                                var html = template('m_project/m_project_notice_item',{dataList:dataList});
                                $this.closest('.vertical-timeline-block').after(html);
                                $this.closest('.vertical-timeline-block').remove();
                                that.bindActionClick();
                            }
                        });
                        break;
                    case 'delProjectNotice'://删除项目动态
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var option = {};
                            option.url = restApi.url_notice+'/'+$this.closest('.vertical-timeline-block').attr('data-id');
                            option.type = 'DELETE';
                            m_ajax.get(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    $this.closest('.vertical-timeline-block').remove();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;
                }

            });
            $(that.element).find('.vertical-timeline-block').off('mouseenter').unbind('mouseleave').hover(function () {

                $(this).find('a').show();

            },function () {
                $(this).find('a').hide();
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


